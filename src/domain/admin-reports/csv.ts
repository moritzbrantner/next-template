import type {
  AdminReportExport,
  AdminReportFormat,
  AdminReportId,
  AdminReportTable,
  AdminReportWindow,
} from './contracts';
import { getAdminReportDetailUseCase } from './detail';
import { createDefaultDeps, type AdminReportDeps } from './report-inputs';

export type { AdminReportExport, AdminReportTable } from './contracts';

function toCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function serializeAdminReportCsv(table: AdminReportTable) {
  return [table.columns, ...table.rows]
    .map((row) => row.map(toCsvCell).join(','))
    .join('\n');
}

export async function exportAdminReportUseCase(
  reportId: AdminReportId,
  window: AdminReportWindow,
  format: AdminReportFormat,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
  filters?: {
    audience?: string | null;
    routeGroup?: string | null;
    path?: string | null;
  },
): Promise<AdminReportExport> {
  const detail = await getAdminReportDetailUseCase(
    reportId,
    window,
    depsPromise,
    filters,
  );
  const baseFilename = `${reportId}-${window}`;

  if (format === 'json') {
    return {
      filename: `${baseFilename}.json`,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(detail, null, 2),
    };
  }

  return {
    filename: `${baseFilename}.csv`,
    contentType: 'text/csv; charset=utf-8',
    body: serializeAdminReportCsv(detail.table),
  };
}
