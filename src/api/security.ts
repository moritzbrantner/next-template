import type { NextRequest } from "next/server";

export type AuditOutcome = "allowed" | "denied" | "error" | "rate_limited";

export type AuditRecord = {
  actorId: string | null;
  action: string;
  outcome: AuditOutcome;
  statusCode: number;
  metadata?: Record<string, unknown>;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const rateLimitStore = new Map<string, RateLimitRecord>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function getRateLimitKey(request: NextRequest, userId: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${getClientIp(request)}`;
}

export function enforceRateLimit(key: string):
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return { ok: true, remaining: MAX_REQUESTS - existing.count, resetAt: existing.resetAt };
}

export function auditAction(record: AuditRecord): void {
  console.info("[audit]", {
    at: new Date().toISOString(),
    ...record,
  });
}
