import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';

import type { AppPermissionKey } from '@/lib/authorization';
import type { FoundationFeatureKey } from '@/src/app-config/feature-keys';
import type { AppSession } from '@/src/auth';
import type {
  AuditRecord,
  RateLimitInput,
  RateLimitResult,
} from '@/src/api/security';
import { problem, ProblemError } from '@/src/http/errors';
import {
  createApiRouteWithDependencies,
  type ApiRouteDependencies,
} from '@/src/http/route';

const adminSession = {
  user: {
    id: 'admin_1',
    email: 'admin@example.com',
    tag: 'admin',
    name: 'Admin',
    image: null,
    bannerImage: null,
    role: 'ADMIN',
  },
} satisfies AppSession;

function createLogger() {
  const testLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };

  testLogger.child.mockReturnValue(testLogger);

  return testLogger;
}

function createDependencies(input?: {
  session?: AppSession | null;
  rateLimitResult?: RateLimitResult;
  audit?: AuditRecord[];
  rateLimitInputs?: RateLimitInput[];
  hasPermission?: (
    role: AppSession['user']['role'] | null | undefined,
    permission: AppPermissionKey,
  ) => Promise<boolean>;
  featureEnabled?: boolean;
}) {
  const audit = input?.audit ?? [];
  const rateLimitInputs = input?.rateLimitInputs ?? [];
  const logger = createLogger();
  const errorReporter = {
    captureException: vi.fn(),
  };

  const deps = {
    getSession: async () => input?.session ?? null,
    getRateLimitKey: (_request, actorId) =>
      actorId ? `user:${actorId}` : 'ip:test',
    enforceRateLimit: async (rateLimitInput) => {
      rateLimitInputs.push(rateLimitInput);

      return (
        input?.rateLimitResult ?? {
          ok: true,
          remaining: 4,
          resetAt: 1_700_000_000_000,
        }
      );
    },
    auditAction: async (record) => {
      audit.push(record);
    },
    hasPermission: async (role, permission) =>
      input?.hasPermission
        ? input.hasPermission(role, permission)
        : permission.startsWith('admin.')
          ? role === 'ADMIN' || role === 'SUPERADMIN'
          : Boolean(role),
    isFeatureEnabledForUser: async () => input?.featureEnabled ?? true,
    getSiteUrl: () => 'https://example.com',
    logger,
    errorReporter,
  } satisfies ApiRouteDependencies;

  return {
    audit,
    deps,
    errorReporter,
    logger,
    rateLimitInputs,
    route: createApiRouteWithDependencies(deps),
  };
}

describe('createApiRoute', () => {
  it('returns a problem response with request id headers for rate-limited requests', async () => {
    const { audit, route } = createDependencies({
      rateLimitResult: {
        ok: false,
        retryAfterSeconds: 42,
        resetAt: 1_700_000_000_000,
      },
    });

    const handler = route({
      action: 'auth.login',
      handler: async () => ({ ok: true }),
    });
    const response = await handler(
      new Request('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'x-request-id': 'req_1',
        },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('content-type')).toContain(
      'application/problem+json',
    );
    expect(response.headers.get('retry-after')).toBe('42');
    expect(response.headers.get('x-request-id')).toBe('req_1');
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'auth.login',
        outcome: 'rate_limited',
        statusCode: 429,
      }),
    );
  });

  it('returns 401 for auth-required routes without a session', async () => {
    const { audit, route } = createDependencies();
    const handler = route({
      action: 'profile.updateDisplayName',
      auth: true,
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/profile/display-name', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'profile.updateDisplayName',
        outcome: 'denied',
        statusCode: 401,
      }),
    );
  });

  it('returns 403 for role-restricted routes when the role does not match', async () => {
    const { audit, route } = createDependencies({
      session: {
        user: {
          ...adminSession.user,
          id: 'user_1',
          email: 'user@example.com',
          role: 'USER',
        },
      },
    });
    const handler = route({
      action: 'admin.reports.authorization',
      roles: ['ADMIN'],
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/admin/reports/authorization'),
    );

    expect(response.status).toBe(403);
    expect(audit).toContainEqual(
      expect.objectContaining({
        actorId: 'user_1',
        action: 'admin.reports.authorization',
        outcome: 'denied',
        statusCode: 403,
      }),
    );
  });

  it('returns 403 for permission-restricted routes when the permission is missing', async () => {
    const { audit, route } = createDependencies({
      session: adminSession,
      hasPermission: async (_role, permission) =>
        permission !== 'admin.roles.edit',
    });
    const handler = route({
      action: 'admin.users.updateRole',
      permission: 'admin.roles.edit',
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/admin/users/user_1/role', {
        method: 'PATCH',
        headers: {
          origin: 'https://example.com',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(audit).toContainEqual(
      expect.objectContaining({
        actorId: 'admin_1',
        action: 'admin.users.updateRole',
        outcome: 'denied',
        statusCode: 403,
      }),
    );
  });

  it('rejects cross-origin mutating cookie-authenticated requests', async () => {
    const { audit, route } = createDependencies({
      session: adminSession,
    });
    const handler = route({
      action: 'admin.users.updateRole',
      permission: 'admin.roles.edit',
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/admin/users/user_1/role', {
        method: 'PATCH',
        headers: {
          origin: 'https://evil.example',
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(audit).toContainEqual(
      expect.objectContaining({
        actorId: 'admin_1',
        action: 'admin.users.updateRole',
        outcome: 'denied',
        statusCode: 403,
      }),
    );
  });

  it('audits successful responses and merges request, rate-limit, and response headers', async () => {
    const { audit, rateLimitInputs, route } = createDependencies({
      session: adminSession,
    });
    const handler = route({
      action: 'admin.reports.authorization',
      roles: ['ADMIN'],
      metadata: { surface: 'admin' },
      handler: async () =>
        Response.json(
          { ok: true },
          {
            headers: {
              'x-extra': 'value',
            },
          },
        ),
    });

    const response = await handler(
      new Request('https://example.com/api/admin/reports/authorization', {
        headers: {
          'x-request-id': 'req_success',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-ratelimit-remaining')).toBe('4');
    expect(response.headers.get('x-request-id')).toBe('req_success');
    expect(response.headers.get('x-extra')).toBe('value');
    expect(rateLimitInputs).toEqual([
      {
        action: 'admin.reports.authorization',
        key: 'admin.reports.authorization:user:admin_1',
      },
    ]);
    expect(audit).toContainEqual(
      expect.objectContaining({
        actorId: 'admin_1',
        action: 'admin.reports.authorization',
        outcome: 'allowed',
        statusCode: 200,
        metadata: { surface: 'admin' },
      }),
    );
  });

  it('returns thrown problem errors and audits their status', async () => {
    const { audit, route } = createDependencies({
      session: adminSession,
    });
    const handler = route({
      action: 'admin.problem',
      handler: async () => {
        throw new ProblemError(
          problem('/problems/example', 'Example problem', 418, 'No coffee.'),
        );
      },
    });

    const response = await handler(
      new Request('https://example.com/api/admin/problem'),
    );
    const body = await response.json();

    expect(response.status).toBe(418);
    expect(body).toMatchObject({
      type: '/problems/example',
      title: 'Example problem',
      detail: 'No coffee.',
    });
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'admin.problem',
        outcome: 'denied',
        statusCode: 418,
      }),
    );
  });

  it('returns 500, logs, and reports unexpected errors', async () => {
    const { audit, errorReporter, logger, route } = createDependencies({
      session: adminSession,
    });
    const failure = new Error('boom');
    const handler = route({
      action: 'admin.unexpected',
      handler: async () => {
        throw failure;
      },
    });

    const response = await handler(
      new Request('https://example.com/api/admin/unexpected'),
    );

    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      { err: failure },
      'API route failed',
    );
    expect(errorReporter.captureException).toHaveBeenCalledWith(failure, {
      action: 'admin.unexpected',
    });
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'admin.unexpected',
        outcome: 'error',
        statusCode: 500,
      }),
    );
  });

  it('returns 400 for malformed JSON when a body schema is configured', async () => {
    const { audit, route } = createDependencies({
      session: adminSession,
    });
    const handler = route({
      action: 'profile.updateDisplayName',
      bodySchema: z.object({ name: z.string() }),
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/profile/display-name', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://example.com',
        },
        body: '{"name":',
      }),
    );

    expect(response.status).toBe(400);
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'profile.updateDisplayName',
        outcome: 'denied',
        statusCode: 400,
      }),
    );
  });

  it('returns 400 for invalid query input', async () => {
    const { audit, route } = createDependencies();
    const handler = route({
      action: 'examples.search',
      querySchema: z.object({ page: z.string().regex(/^\d+$/) }),
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/examples?page=abc'),
    );

    expect(response.status).toBe(400);
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'examples.search',
        outcome: 'denied',
        statusCode: 400,
      }),
    );
  });

  it('returns 404 for disabled feature-gated routes', async () => {
    const { audit, route } = createDependencies({
      featureEnabled: false,
    });
    const handler = route({
      action: 'examples.table',
      featureKey: 'examples.table' as FoundationFeatureKey,
      handler: async () => ({ ok: true }),
    });

    const response = await handler(
      new Request('https://example.com/api/examples/table'),
    );

    expect(response.status).toBe(404);
    expect(audit).toContainEqual(
      expect.objectContaining({
        action: 'examples.table',
        outcome: 'denied',
        statusCode: 404,
      }),
    );
  });
});
