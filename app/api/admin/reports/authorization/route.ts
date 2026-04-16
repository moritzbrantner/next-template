import { secureRoute } from '@/src/api/route-security';
import { hasPermissionForRole } from '@/src/domain/authorization/service';
import { isFeatureEnabled } from '@/src/foundation/features/runtime';

export async function GET(request: Request) {
  if (!isFeatureEnabled('admin.reports')) {
    return new Response('Not found', { status: 404 });
  }

  const guard = await secureRoute({
    request,
    action: 'admin.reports.authorization',
    requiredPermission: 'admin.reports.read',
  });

  if (!guard.ok) {
    return guard.response;
  }

  return guard.json({
    action: 'viewReports',
    allowed: await hasPermissionForRole(guard.session!.user.role, 'admin.reports.read'),
  });
}
