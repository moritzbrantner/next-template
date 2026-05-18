import {
  getProblemReportById,
  isProblemReportStatus,
  updateProblemReport,
} from '@/src/domain/support/problem-reports';
import { secureRoute } from '@/src/api/route-security';

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await context.params;
  const guard = await secureRoute({
    request,
    action: 'admin.problemReports.read',
    requiredPermission: 'admin.problemReports.read',
    metadata: { reportId },
  });

  if (!guard.ok) {
    return guard.response;
  }

  const report = await getProblemReportById(reportId);

  if (!report) {
    return guard.json({ error: 'Problem report not found.' }, { status: 404 });
  }

  return guard.json({ report });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await context.params;
  const guard = await secureRoute({
    request,
    action: 'admin.problemReports.update',
    requiredPermission: 'admin.problemReports.update',
    metadata: { reportId },
  });

  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json().catch(() => null)) as {
    status?: string;
    adminNote?: string | null;
  } | null;

  if (!isProblemReportStatus(body?.status)) {
    return guard.json(
      { error: 'A valid problem report status is required.' },
      { status: 400 },
    );
  }

  const report = await updateProblemReport({
    reportId,
    status: body.status,
    adminNote: body.adminNote,
  });

  if (!report) {
    return guard.json({ error: 'Problem report not found.' }, { status: 404 });
  }

  return guard.json({ report });
}
