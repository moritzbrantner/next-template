import { createFileRoute } from '@tanstack/react-router';

import { requireRole } from '@/lib/authorization';
import { getAuthSession } from '@/src/auth.server';
import { auditAdminReportsAction, enforceAdminReportsRateLimit } from '@/src/api/security-adapters';
import { getAdminActionPermissions } from '@/src/domain/authorization/use-cases';

export const Route = createFileRoute('/api/admin/reports/authorization')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await getAuthSession();
        const actorId = session?.user?.id ?? null;
        const action = 'viewReports';

        const rateLimit = await enforceAdminReportsRateLimit(request, actorId);

        if (!rateLimit.ok) {
          await auditAdminReportsAction({
            actorId,
            action,
            outcome: 'rate_limited',
            statusCode: 429,
          });

          return Response.json(
            { error: 'Rate limit exceeded.' },
            {
              status: 429,
              headers: {
                'retry-after': String(rateLimit.retryAfterSeconds),
              },
            },
          );
        }

        try {
          const authorizedSession = await requireRole('ADMIN');
          const [reportsPermission] = getAdminActionPermissions(authorizedSession.user.role).filter(
            (permission) => permission.key === 'viewReports',
          );

          await auditAdminReportsAction({
            actorId: authorizedSession.user.id,
            action,
            outcome: 'allowed',
            statusCode: 200,
            metadata: {
              remainingBudget: rateLimit.remaining,
            },
          });

          return Response.json(
            {
              action,
              allowed: reportsPermission?.allowed ?? false,
            },
            {
              status: 200,
              headers: {
                'x-ratelimit-remaining': String(rateLimit.remaining),
                'x-ratelimit-reset': String(rateLimit.resetAt),
              },
            },
          );
        } catch (error) {
          const status = (error as { status?: number })?.status;

          if (status === 401 || status === 403) {
            await auditAdminReportsAction({
              actorId,
              action,
              outcome: 'denied',
              statusCode: status,
            });

            return Response.json(
              {
                error: status === 401 ? 'Authentication required.' : 'Forbidden.',
              },
              { status },
            );
          }

          await auditAdminReportsAction({
            actorId,
            action,
            outcome: 'error',
            statusCode: 500,
          });

          return Response.json({ error: 'Internal server error.' }, { status: 500 });
        }
      },
    },
  },
});
