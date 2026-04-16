import {
  exportAdminReportUseCase,
  isAdminReportId,
  isAdminReportWindow,
  type AdminReportFormat,
} from '@/src/domain/admin-reports/use-cases';
import { isFeatureEnabled } from '@/src/foundation/features/runtime';
import { createProblemResponse, invalidQueryProblem, notFoundProblem } from '@/src/http/errors';
import { secureRoute } from '@/src/api/route-security';

function resolveFormat(value: string | null): AdminReportFormat {
  return value === 'json' ? 'json' : 'csv';
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  if (!isFeatureEnabled('admin.reports')) {
    return createProblemResponse(notFoundProblem());
  }

  const { reportId } = await context.params;

  if (!isAdminReportId(reportId)) {
    return createProblemResponse(notFoundProblem());
  }

  const guard = await secureRoute({
    request,
    action: 'admin.reports.export',
    allowedRoles: ['ADMIN', 'SUPERADMIN'],
    metadata: { reportId },
  });

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const window = url.searchParams.get('window') ?? '7d';
  const format = resolveFormat(url.searchParams.get('format'));

  if (!isAdminReportWindow(window)) {
    return createProblemResponse(invalidQueryProblem('Unsupported report window.', { window: ['Expected one of 24h, 7d, 30d.'] }));
  }

  const exported = await exportAdminReportUseCase(reportId, window, format).catch(() => ({
    filename: `${reportId}-${window}.${format}`,
    contentType: format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
    body: format === 'json'
      ? JSON.stringify({ reportId, error: 'Report data is temporarily unavailable.' }, null, 2)
      : 'Message\nReport data is temporarily unavailable.',
  }));

  return guard.respond(exported.body, {
    headers: {
      'content-type': exported.contentType,
      'content-disposition': `attachment; filename="${exported.filename}"`,
    },
    metadata: { reportId, format, window },
  });
}
