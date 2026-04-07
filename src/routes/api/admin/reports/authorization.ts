import { createFileRoute } from '@tanstack/react-router';

import { secureRoute } from '@/src/api/route-security';
import { getAdminActionPermissions } from '@/src/domain/authorization/use-cases';

export const Route = createFileRoute('/api/admin/reports/authorization')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const guard = await secureRoute({
          request,
          action: 'admin.reports.authorization',
          allowedRoles: ['ADMIN'],
        });

        if (!guard.ok) {
          return guard.response;
        }

        const [reportsPermission] = getAdminActionPermissions(guard.session!.user.role).filter(
          (permission) => permission.key === 'viewReports',
        );

        return guard.json({
          action: 'viewReports',
          allowed: reportsPermission?.allowed ?? false,
        });
      },
    },
  },
});
