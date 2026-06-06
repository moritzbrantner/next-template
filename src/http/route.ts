import type { ZodType } from 'zod';

import type { AppPermissionKey, AppRole } from '@/lib/authorization';
import type { FoundationFeatureKey } from '@/src/app-config/feature-keys';
import type { AppSession } from '@/src/auth';
import { getAuthSession } from '@/src/auth.server';
import { hasPermissionForRole } from '@/src/domain/authorization/service';
import {
  auditAction,
  enforceRateLimit,
  getRateLimitKey,
  type AuditRecord,
  type RateLimitInput,
  type RateLimitResult,
} from '@/src/api/security';
import { getEnv } from '@/src/config/env';
import { errorReporter, logger } from '@/src/observability/logger';
import type { ErrorReporter, Logger } from '@/src/observability/contracts';
import {
  createRequestContext,
  setRequestActorId,
  withRequestContext,
} from '@/src/observability/request-context';
import {
  authenticationRequiredProblem,
  createProblemResponse,
  forbiddenProblem,
  internalServerProblem,
  invalidBodyProblem,
  invalidQueryProblem,
  notFoundProblem,
  type ProblemDetail,
  ProblemError,
  rateLimitedProblem,
  zodFieldErrors,
} from '@/src/http/errors';

type QueryValue = string | string[];
type QueryRecord = Record<string, QueryValue>;
type IsFeatureEnabledForUser =
  (typeof import('@/src/foundation/features/access'))['isFeatureEnabledForUser'];

type BodySchema<TBody> = ZodType<TBody> | undefined;
type QuerySchema<TQuery> = ZodType<TQuery> | undefined;

type HandlerContext<TBody, TQuery> = {
  request: Request;
  routeContext: unknown;
  session: AppSession | null;
  actorId: string | null;
  body: TBody;
  query: TQuery;
};

type CreateApiRouteOptions<TBody, TQuery, TResult> = {
  action: string;
  featureKey?: FoundationFeatureKey;
  auth?: boolean;
  roles?: readonly AppRole[];
  permission?: AppPermissionKey;
  skipOriginCheck?: boolean;
  metadata?: Record<string, unknown>;
  bodySchema?: BodySchema<TBody>;
  querySchema?: QuerySchema<TQuery>;
  handler: (
    context: HandlerContext<TBody, TQuery>,
  ) => Promise<Response | TResult> | Response | TResult;
};

export type ApiRouteDependencies = {
  getSession: () => Promise<AppSession | null>;
  getRateLimitKey: (request: Request, userId: string | null) => string;
  enforceRateLimit: (input: RateLimitInput) => Promise<RateLimitResult>;
  auditAction: (record: AuditRecord) => Promise<void>;
  hasPermission: (
    role: AppRole | null | undefined,
    permission: AppPermissionKey,
  ) => Promise<boolean>;
  isFeatureEnabledForUser: IsFeatureEnabledForUser;
  getSiteUrl: () => string;
  logger: Logger;
  errorReporter: ErrorReporter;
};

function defaultOutcomeForStatus(status: number) {
  if (status === 429) {
    return 'rate_limited' as const;
  }

  if (status >= 500) {
    return 'error' as const;
  }

  if (status >= 400) {
    return 'denied' as const;
  }

  return 'allowed' as const;
}

function toMultiValueRecord(
  entries: Iterable<[string, FormDataEntryValue | string]>,
) {
  const record: Record<
    string,
    FormDataEntryValue | string | Array<FormDataEntryValue | string>
  > = {};

  for (const [key, value] of entries) {
    const existing = record[key];

    if (existing === undefined) {
      record[key] = value;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      continue;
    }

    record[key] = [existing, value];
  }

  return record;
}

function toQueryRecord(searchParams: URLSearchParams): QueryRecord {
  const record: QueryRecord = {};

  for (const [key, value] of searchParams.entries()) {
    const current = record[key];

    if (current === undefined) {
      record[key] = value;
      continue;
    }

    if (Array.isArray(current)) {
      current.push(value);
      continue;
    }

    record[key] = [current, value];
  }

  return record;
}

async function parseRequestBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const formData = await request.formData();
    return toMultiValueRecord(formData.entries());
  }

  if (
    contentType.includes('application/json') ||
    contentType.includes('text/json')
  ) {
    return request.json();
  }

  if ((request.headers.get('content-length') ?? '0') === '0') {
    return {};
  }

  return request.json();
}

function withStandardHeaders(
  response: Response,
  requestId: string,
  extraHeaders?: HeadersInit,
) {
  const headers = new Headers(response.headers);
  headers.set('x-request-id', requestId);

  if (extraHeaders) {
    new Headers(extraHeaders).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function buildRateLimitHeaders(rateLimit: RateLimitResult) {
  const headers = new Headers({
    'x-ratelimit-reset': String(rateLimit.resetAt),
  });

  if (rateLimit.ok) {
    headers.set('x-ratelimit-remaining', String(rateLimit.remaining));
  } else {
    headers.set('retry-after', String(rateLimit.retryAfterSeconds));
  }

  return headers;
}

function isMutatingRequest(request: Request) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
}

function getOriginFromHeader(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function hasValidRequestOriginForSite(request: Request, siteUrl: string) {
  const requestOrigin = new URL(request.url).origin;
  const siteOrigin = new URL(siteUrl).origin;
  const allowedOrigins = new Set([requestOrigin, siteOrigin]);
  const origin = getOriginFromHeader(request.headers.get('origin'));
  const referer = getOriginFromHeader(request.headers.get('referer'));

  return Boolean(
    (origin && allowedOrigins.has(origin)) ||
    (!origin && referer && allowedOrigins.has(referer)),
  );
}

function createGuardProblemResponse(
  problemDetail: ProblemDetail,
  headers: Headers,
  requestId: string,
) {
  return createProblemResponse(problemDetail, {
    headers: new Headers({
      ...Object.fromEntries(headers.entries()),
      'x-request-id': requestId,
    }),
  });
}

const defaultApiRouteDependencies = {
  getSession: getAuthSession,
  getRateLimitKey,
  enforceRateLimit,
  auditAction,
  hasPermission: hasPermissionForRole,
  isFeatureEnabledForUser: async (featureKey, user) => {
    const featureAccess = await import('@/src/foundation/features/access');
    return featureAccess.isFeatureEnabledForUser(featureKey, user);
  },
  getSiteUrl: () => getEnv().site.url,
  logger,
  errorReporter,
} satisfies ApiRouteDependencies;

export function createApiRouteWithDependencies(deps: ApiRouteDependencies) {
  return function createInjectedApiRoute<
    TBody = undefined,
    TQuery = undefined,
    TResult = unknown,
  >(options: CreateApiRouteOptions<TBody, TQuery, TResult>) {
    return async function routeHandler(
      request: Request,
      routeContext?: unknown,
    ) {
      const requestContext = createRequestContext(request);

      return withRequestContext(requestContext, async () => {
        const routeLogger = deps.logger.child({ action: options.action });
        const session = await deps.getSession();
        const actorId = session?.user.id ?? null;
        setRequestActorId(actorId);

        const rateLimit = await deps.enforceRateLimit({
          action: options.action,
          key: `${options.action}:${deps.getRateLimitKey(request, actorId)}`,
        });
        const rateLimitHeaders = buildRateLimitHeaders(rateLimit);

        const audit = async (status: number) => {
          await deps.auditAction({
            actorId,
            action: options.action,
            outcome: defaultOutcomeForStatus(status),
            statusCode: status,
            metadata: options.metadata,
          });
        };

        try {
          if (!rateLimit.ok) {
            await audit(429);
            return createGuardProblemResponse(
              rateLimitedProblem(),
              rateLimitHeaders,
              requestContext.requestId,
            );
          }

          if (
            options.featureKey &&
            !(await deps.isFeatureEnabledForUser(
              options.featureKey,
              session?.user?.id
                ? { id: session.user.id, role: session.user.role }
                : null,
            ))
          ) {
            await audit(404);
            return createGuardProblemResponse(
              notFoundProblem(),
              rateLimitHeaders,
              requestContext.requestId,
            );
          }

          if (options.auth && !actorId) {
            await audit(401);
            return createGuardProblemResponse(
              authenticationRequiredProblem(),
              rateLimitHeaders,
              requestContext.requestId,
            );
          }

          if (options.roles?.length) {
            if (!actorId) {
              await audit(401);
              return createGuardProblemResponse(
                authenticationRequiredProblem(),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }

            if (
              !session?.user.role ||
              !options.roles.includes(session.user.role)
            ) {
              await audit(403);
              return createGuardProblemResponse(
                forbiddenProblem(),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }
          }

          if (options.permission) {
            if (!actorId) {
              await audit(401);
              return createGuardProblemResponse(
                authenticationRequiredProblem(),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }

            if (
              !(await deps.hasPermission(
                session?.user.role,
                options.permission,
              ))
            ) {
              await audit(403);
              return createGuardProblemResponse(
                forbiddenProblem(),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }
          }

          if (
            isMutatingRequest(request) &&
            !options.skipOriginCheck &&
            !hasValidRequestOriginForSite(request, deps.getSiteUrl())
          ) {
            await audit(403);
            return createGuardProblemResponse(
              forbiddenProblem(),
              rateLimitHeaders,
              requestContext.requestId,
            );
          }

          const queryInput = toQueryRecord(new URL(request.url).searchParams);
          const parsedQuery = options.querySchema
            ? options.querySchema.safeParse(queryInput)
            : ({ success: true, data: undefined } as const);

          if (!parsedQuery.success) {
            await audit(400);
            return createGuardProblemResponse(
              invalidQueryProblem(undefined, zodFieldErrors(parsedQuery.error)),
              rateLimitHeaders,
              requestContext.requestId,
            );
          }

          let parsedBody: TBody | undefined;

          if (options.bodySchema) {
            let rawBody: unknown;

            try {
              rawBody = await parseRequestBody(request);
            } catch {
              await audit(400);
              return createGuardProblemResponse(
                invalidBodyProblem(
                  'Request body must be valid JSON or form data.',
                ),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }

            const bodyResult = options.bodySchema.safeParse(rawBody);

            if (!bodyResult.success) {
              await audit(400);
              return createGuardProblemResponse(
                invalidBodyProblem(undefined, zodFieldErrors(bodyResult.error)),
                rateLimitHeaders,
                requestContext.requestId,
              );
            }

            parsedBody = bodyResult.data;
          }

          const result = await options.handler({
            request,
            routeContext,
            session,
            actorId,
            body: parsedBody as TBody,
            query: parsedQuery.data as TQuery,
          });

          const response =
            result instanceof Response
              ? result
              : Response.json(result, {
                  status: 200,
                });

          await audit(response.status);
          return withStandardHeaders(
            response,
            requestContext.requestId,
            rateLimitHeaders,
          );
        } catch (error) {
          const problem =
            error instanceof ProblemError
              ? error.problem
              : internalServerProblem();

          if (problem.status >= 500) {
            routeLogger.error({ err: error }, 'API route failed');
            await deps.errorReporter.captureException(error, {
              action: options.action,
            });
          }

          await audit(problem.status);
          return createGuardProblemResponse(
            problem,
            rateLimitHeaders,
            requestContext.requestId,
          );
        }
      });
    };
  };
}

export const createApiRoute = createApiRouteWithDependencies(
  defaultApiRouteDependencies,
);
