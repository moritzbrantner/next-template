import { eq, lte, sql } from 'drizzle-orm';
import { createClient } from 'redis';

import { getEnv } from '@/src/config/env';
import { getDb } from '@/src/db/client';
import { securityAuditLogs, securityRateLimitCounters } from '@/src/db/schema';

export type AuditOutcome = 'allowed' | 'denied' | 'error' | 'rate_limited';

export type AuditRecord = {
  actorId: string | null;
  action: string;
  outcome: AuditOutcome;
  statusCode: number;
  metadata?: Record<string, unknown>;
};

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number };

export type RateLimitPolicy = {
  maxRequests: number;
  windowMs: number;
};

export type RateLimitPolicyMap = Record<string, RateLimitPolicy>;

export type RateLimitInput = {
  action: string;
  key: string;
};

export interface RateLimitAdapter {
  incrementWindow(input: {
    key: string;
    now: number;
    windowMs: number;
    maxRequests: number;
  }): Promise<{ count: number; resetAt: number }>;
}

export interface AuditPersistenceAdapter {
  persist(record: {
    actorId: string | null;
    action: string;
    outcome: AuditOutcome;
    statusCode: number;
    metadata: Record<string, unknown>;
    timestamp: Date;
  }): Promise<void>;
}

export interface SecurityService {
  getRateLimitKey(request: Request, userId: string | null): string;
  enforceRateLimit(input: RateLimitInput): Promise<RateLimitResult>;
  auditAction(record: AuditRecord): Promise<void>;
}

export const DEFAULT_RATE_LIMIT_POLICY = {
  maxRequests: 30,
  windowMs: 60_000,
} satisfies RateLimitPolicy;

export const DEFAULT_RATE_LIMIT_POLICIES = {
  'auth.login': {
    maxRequests: 5,
    windowMs: 60_000,
  },
  'auth.loginOtp.request': {
    maxRequests: 3,
    windowMs: 60_000,
  },
  'auth.loginOtp.verify': {
    maxRequests: 5,
    windowMs: 60_000,
  },
  'account.forgotPassword': {
    maxRequests: 3,
    windowMs: 300_000,
  },
  'account.resetPassword': {
    maxRequests: 5,
    windowMs: 300_000,
  },
  'profile.image.upload': {
    maxRequests: 10,
    windowMs: 60_000,
  },
  'admin.*': {
    maxRequests: 60,
    windowMs: 60_000,
  },
} satisfies RateLimitPolicyMap;

const REDACTED = '[REDACTED]';
const BLOCKED_METADATA_KEYS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /email/i,
  /phone/i,
];

function isSensitiveKey(key: string): boolean {
  return BLOCKED_METADATA_KEYS.some((pattern) => pattern.test(key));
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => {
        if (isSensitiveKey(key)) {
          return [key, REDACTED] as const;
        }

        return [key, sanitizeMetadata(nested)] as const;
      },
    );

    return Object.fromEntries(entries);
  }

  return value;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function resolveRateLimitPolicy(
  action: string,
  policies: RateLimitPolicyMap = DEFAULT_RATE_LIMIT_POLICIES,
  defaultPolicy: RateLimitPolicy = DEFAULT_RATE_LIMIT_POLICY,
): RateLimitPolicy {
  const exactPolicy = policies[action];

  if (exactPolicy) {
    return exactPolicy;
  }

  const wildcardMatch = Object.entries(policies)
    .filter(([key]) => key.endsWith('.*'))
    .sort(([left], [right]) => right.length - left.length)
    .find(([key]) => action.startsWith(key.slice(0, -1)));

  return wildcardMatch?.[1] ?? defaultPolicy;
}

export class RedisRateLimitAdapter implements RateLimitAdapter {
  constructor(
    private readonly redisClient: {
      eval(
        script: string,
        options: { keys: string[]; arguments: string[] },
      ): Promise<(number | string)[]>;
    },
  ) {}

  async incrementWindow(input: {
    key: string;
    now: number;
    windowMs: number;
    maxRequests: number;
  }): Promise<{ count: number; resetAt: number }> {
    const script = `
local counter = redis.call("GET", KEYS[1])
if not counter then
  redis.call("SET", KEYS[1], 1, "PX", ARGV[2])
  return {1, tonumber(ARGV[1]) + tonumber(ARGV[2])}
end

local nextCount = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[2])
  ttl = tonumber(ARGV[2])
end

return {nextCount, tonumber(ARGV[1]) + ttl}
`;

    const [count, resetAt] = await this.redisClient.eval(script, {
      keys: [input.key],
      arguments: [
        String(input.now),
        String(input.windowMs),
        String(input.maxRequests),
      ],
    });

    return { count: Number(count), resetAt: Number(resetAt) };
  }
}

export class PostgresRateLimitAdapter implements RateLimitAdapter {
  async incrementWindow(input: {
    key: string;
    now: number;
    windowMs: number;
    maxRequests: number;
  }): Promise<{ count: number; resetAt: number }> {
    const db = getDb();
    const nowDate = new Date(input.now);
    const nextReset = new Date(input.now + input.windowMs);

    const [upserted] = await db
      .insert(securityRateLimitCounters)
      .values({
        key: input.key,
        count: 1,
        resetAt: nextReset,
      })
      .onConflictDoUpdate({
        target: securityRateLimitCounters.key,
        set: {
          count: 1,
          resetAt: nextReset,
        },
        setWhere: lte(securityRateLimitCounters.resetAt, nowDate),
      })
      .returning();

    if (upserted) {
      return { count: upserted.count, resetAt: upserted.resetAt.getTime() };
    }

    const [incremented] = await db
      .update(securityRateLimitCounters)
      .set({
        count: sql`${securityRateLimitCounters.count} + 1`,
      })
      .where(eq(securityRateLimitCounters.key, input.key))
      .returning();

    return {
      count: incremented?.count ?? input.maxRequests,
      resetAt: incremented?.resetAt.getTime() ?? nextReset.getTime(),
    };
  }
}

export class PostgresAuditPersistenceAdapter implements AuditPersistenceAdapter {
  async persist(record: {
    actorId: string | null;
    action: string;
    outcome: AuditOutcome;
    statusCode: number;
    metadata: Record<string, unknown>;
    timestamp: Date;
  }): Promise<void> {
    const db = getDb();

    await db.insert(securityAuditLogs).values({
      id: crypto.randomUUID(),
      actorId: record.actorId,
      action: record.action,
      outcome: record.outcome,
      statusCode: record.statusCode,
      metadata: record.metadata,
      timestamp: record.timestamp,
    });
  }
}

export class DefaultSecurityService implements SecurityService {
  private readonly defaultPolicy: RateLimitPolicy;
  private readonly policies: RateLimitPolicyMap;

  constructor(
    private readonly rateLimitAdapter: RateLimitAdapter,
    private readonly auditPersistenceAdapter: AuditPersistenceAdapter,
    config: {
      maxRequests?: number;
      windowMs?: number;
      policies?: RateLimitPolicyMap;
    } = {},
  ) {
    this.defaultPolicy = {
      maxRequests: config.maxRequests ?? DEFAULT_RATE_LIMIT_POLICY.maxRequests,
      windowMs: config.windowMs ?? DEFAULT_RATE_LIMIT_POLICY.windowMs,
    };
    this.policies = {
      ...DEFAULT_RATE_LIMIT_POLICIES,
      ...(config.policies ?? {}),
    };
  }

  getRateLimitKey(request: Request, userId: string | null): string {
    if (userId) {
      return `user:${userId}`;
    }

    return `ip:${getClientIp(request)}`;
  }

  async enforceRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
    const now = Date.now();
    const policy = resolveRateLimitPolicy(
      input.action,
      this.policies,
      this.defaultPolicy,
    );

    const { count, resetAt } = await this.rateLimitAdapter.incrementWindow({
      key: input.key,
      now,
      windowMs: policy.windowMs,
      maxRequests: policy.maxRequests,
    });

    if (count > policy.maxRequests) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        resetAt,
      };
    }

    return {
      ok: true,
      remaining: policy.maxRequests - count,
      resetAt,
    };
  }

  async auditAction(record: AuditRecord): Promise<void> {
    await this.auditPersistenceAdapter.persist({
      actorId: record.actorId,
      action: record.action,
      outcome: record.outcome,
      statusCode: record.statusCode,
      metadata:
        (sanitizeMetadata(record.metadata ?? {}) as Record<string, unknown>) ??
        {},
      timestamp: new Date(),
    });
  }
}

let securityService: SecurityService | null = null;
let redisClientPromise: Promise<{
  eval(
    script: string,
    options: { keys: string[]; arguments: string[] },
  ): Promise<unknown>;
}> | null = null;

function createRedisRateLimitAdapter(redisUrl: string): RateLimitAdapter {
  return new RedisRateLimitAdapter({
    async eval(script, options) {
      redisClientPromise ??= createClient({ url: redisUrl }).connect();
      const client = await redisClientPromise;
      const result = await client.eval(script, options);

      return Array.isArray(result) ? result : [];
    },
  });
}

function getSecurityService() {
  if (!securityService) {
    const env = getEnv();
    const rateLimitAdapter =
      env.rateLimit.store === 'redis'
        ? createRedisRateLimitAdapter(env.rateLimit.redisUrl!)
        : new PostgresRateLimitAdapter();

    securityService = new DefaultSecurityService(
      rateLimitAdapter,
      new PostgresAuditPersistenceAdapter(),
      {
        policies: env.rateLimit.overrides,
      },
    );
  }

  return securityService;
}

export function resetSecurityServiceForTests() {
  securityService = null;
  redisClientPromise = null;
}

export function getRateLimitKey(
  request: Request,
  userId: string | null,
): string {
  return getSecurityService().getRateLimitKey(request, userId);
}

export async function enforceRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  return getSecurityService().enforceRateLimit(input);
}

export async function auditAction(record: AuditRecord): Promise<void> {
  return getSecurityService().auditAction(record);
}

export function createSecurityService(adapters: {
  rateLimit: RateLimitAdapter;
  audit: AuditPersistenceAdapter;
  config?: {
    maxRequests?: number;
    windowMs?: number;
    policies?: RateLimitPolicyMap;
  };
}): SecurityService {
  return new DefaultSecurityService(
    adapters.rateLimit,
    adapters.audit,
    adapters.config,
  );
}
