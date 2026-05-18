import {
  isProblemReportStatus,
  listProblemReports,
  problemReportAreas,
  type ProblemReportArea,
} from '@/src/domain/support/problem-reports';
import { secureRoute } from '@/src/api/route-security';

function isProblemReportArea(value: string | null): value is ProblemReportArea {
  return problemReportAreas.includes(value as ProblemReportArea);
}

export async function GET(request: Request) {
  const guard = await secureRoute({
    request,
    action: 'admin.problemReports.list',
    requiredPermission: 'admin.problemReports.read',
  });

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const area = url.searchParams.get('area');
  const reports = await listProblemReports({
    status: isProblemReportStatus(status) ? status : undefined,
    area: isProblemReportArea(area) ? area : undefined,
  });

  return guard.json({ reports });
}
