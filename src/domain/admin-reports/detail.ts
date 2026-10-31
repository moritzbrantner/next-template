import {
  isAdminReportId,
  type AdminReportDetail,
  type AdminReportId,
  type AdminReportWindow,
} from './contracts';
import { buildAuditActivityDetail } from './audit-activity';
import { buildNavigationJourneyDetail } from './navigation-journeys';
import { createUnavailableCard } from './report-helpers';
import {
  createDefaultDeps,
  loadReportInputs,
  type AdminReportDeps,
} from './report-inputs';
import { buildSchemaHealthDetail } from './schema-health';
import { buildSecurityAccessDetail } from './security-access';
import { buildWorkspaceAdoptionDetail } from './workspace-adoption';

export type { AdminReportDetail } from './contracts';

function assertReportId(reportId: string): asserts reportId is AdminReportId {
  if (!isAdminReportId(reportId)) {
    throw new Error(`Unsupported admin report id "${reportId}".`);
  }
}

function createDegradedDetail(
  reportId: AdminReportId,
  window: AdminReportWindow,
  generatedAt: Date,
  message: string,
): AdminReportDetail {
  return {
    reportId,
    generatedAt: generatedAt.toISOString(),
    window,
    status: 'degraded',
    message,
    cards: [createUnavailableCard('reportStatus', 'Report status', message)],
    series: [],
    breakdowns: [],
    table: {
      columns: ['Message'],
      rows: [],
      emptyMessage: message,
    },
  };
}

export async function getAdminReportDetailUseCase(
  reportId: AdminReportId,
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
  filters?: {
    audience?: string | null;
    routeGroup?: string | null;
    path?: string | null;
  },
): Promise<AdminReportDetail> {
  assertReportId(reportId);
  const deps = await depsPromise;
  const input = await loadReportInputs(window, deps);

  if (input.status === 'degraded') {
    return createDegradedDetail(
      reportId,
      window,
      input.generatedAt,
      input.message ?? 'Data unavailable.',
    );
  }

  switch (reportId) {
    case 'securityAccess':
      return buildSecurityAccessDetail(input);
    case 'auditActivity':
      return buildAuditActivityDetail(input);
    case 'workspaceAdoption':
      return buildWorkspaceAdoptionDetail(input);
    case 'schemaHealth':
      return buildSchemaHealthDetail(input);
    case 'navigationJourneys':
      return buildNavigationJourneyDetail(input, filters);
    default:
      throw new Error(`Unsupported admin report id "${String(reportId)}".`);
  }
}
