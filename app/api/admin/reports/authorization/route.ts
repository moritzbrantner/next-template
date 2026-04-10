import { secureRoute } from '@/src/api/route-security';
import { getAdminActionPermissions } from '@/src/domain/authorization/use-cases';

export async function GET(request: Request) {
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
}
