import type { AppRole } from '@/lib/authorization';
import { getDb } from '@/src/db/client';
import { shouldUseDatabaseReadFallback } from '@/src/site-config/service';

export const adminReportIds = ['securityAccess', 'auditActivity', 'workspaceAdoption', 'schemaHealth'] as const;
export type AdminReportId = (typeof adminReportIds)[number];

export const adminReportWindows = ['24h', '7d', '30d'] as const;
export type AdminReportWindow = (typeof adminReportWindows)[number];

export type AdminReportFormat = 'json' | 'csv';

export function isAdminReportId(value: string): value is AdminReportId {
  return adminReportIds.includes(value as AdminReportId);
}

export function isAdminReportWindow(value: string): value is AdminReportWindow {
  return adminReportWindows.includes(value as AdminReportWindow);
}

type ReportUser = {
  id: string;
  role: AppRole;
  lockoutUntil: Date | null;
};

type ReportAuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  outcome: string;
  statusCode: number;
  timestamp: Date;
};

type ReportPageVisit = {
  id: string;
  userId: string;
  pathname: string;
  href: string;
  visitedAt: Date;
};

type ReportJob = {
  id: string;
  jobName: string;
  status: 'pending' | 'running' | 'retrying' | 'completed' | 'failed';
  attempts: number;
  lastError: string | null;
  runAt: Date;
  updatedAt: Date;
};

export type AdminReportMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminReportCard = {
  label: string;
  value: string;
  detail?: string;
};

export type AdminReportTable = {
  columns: string[];
  rows: string[][];
  emptyMessage: string;
};

export type AdminReportDetail = {
  reportId: AdminReportId;
  cards: AdminReportCard[];
  table: AdminReportTable;
};

export type AdminReportSummary = {
  metrics: AdminReportMetric[];
};

export type AdminReportExport = {
  filename: string;
  contentType: string;
  body: string;
};

type AdminReportDeps = {
  listUsers: () => Promise<ReportUser[]>;
  listAuditLogsSince: (since: Date) => Promise<ReportAuditLog[]>;
  listPageVisitsSince: (since: Date) => Promise<ReportPageVisit[]>;
  listJobsSince: (since: Date) => Promise<ReportJob[]>;
};

function getWindowStart(window: AdminReportWindow) {
  const now = Date.now();

  switch (window) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '7d':
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatTimestamp(value: Date | null | undefined) {
  return value ? value.toISOString() : 'N/A';
}

function getUniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function isAdminAction(action: string) {
  return action.startsWith('admin.');
}

function isPrivilegedAdminRole(role: AppRole) {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

function isAdminPagePath(pathname: string) {
  return pathname.startsWith('/admin');
}

function toCsvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function serializeAdminReportCsv(table: AdminReportTable) {
  return [table.columns, ...table.rows].map((row) => row.map(toCsvCell).join(',')).join('\n');
}

function assertReportId(reportId: string): asserts reportId is AdminReportId {
  if (!isAdminReportId(reportId)) {
    throw new Error(`Unsupported admin report id "${reportId}".`);
  }
}

async function createDefaultDeps(): Promise<AdminReportDeps> {
  return {
    listUsers: async () => {
      return getDb().query.users.findMany({
        columns: {
          id: true,
          role: true,
          lockoutUntil: true,
        },
      });
    },
    listAuditLogsSince: async (since) => {
      return getDb().query.securityAuditLogs.findMany({
        where: (table, { gte: innerGte }) => innerGte(table.timestamp, since),
        orderBy: (table, { desc }) => [desc(table.timestamp)],
      });
    },
    listPageVisitsSince: async (since) => {
      return getDb().query.pageVisits.findMany({
        where: (table, { gte: innerGte }) => innerGte(table.visitedAt, since),
        orderBy: (table, { desc }) => [desc(table.visitedAt)],
      });
    },
    listJobsSince: async (since) => {
      return getDb().query.jobOutbox.findMany({
        where: (table, { gte: innerGte }) => innerGte(table.updatedAt, since),
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      });
    },
  };
}

function buildSecurityAccessDetail(input: {
  users: ReportUser[];
  auditLogs: ReportAuditLog[];
}): AdminReportDetail {
  const now = Date.now();
  const lockedUsers = input.users.filter((user) => user.lockoutUntil && user.lockoutUntil.getTime() > now);
  const deniedAdminActions = input.auditLogs.filter((log) => isAdminAction(log.action) && ['denied', 'rate_limited'].includes(log.outcome));
  const rows = input.auditLogs.slice(0, 12).map((log) => [
    formatTimestamp(log.timestamp),
    log.action,
    log.outcome,
    String(log.statusCode),
    log.actorId ?? 'system',
  ]);

  return {
    reportId: 'securityAccess',
    cards: [
      { label: 'Admin accounts', value: formatNumber(input.users.filter((user) => isPrivilegedAdminRole(user.role)).length) },
      { label: 'Manager accounts', value: formatNumber(input.users.filter((user) => user.role === 'MANAGER').length) },
      { label: 'Locked accounts', value: formatNumber(lockedUsers.length) },
      { label: 'Denied admin actions', value: formatNumber(deniedAdminActions.length) },
    ],
    table: {
      columns: ['Timestamp', 'Action', 'Outcome', 'Status', 'Actor'],
      rows,
      emptyMessage: 'No security activity in the selected window.',
    },
  };
}

function buildAuditActivityDetail(auditLogs: ReportAuditLog[]): AdminReportDetail {
  const deniedEvents = auditLogs.filter((log) => log.outcome === 'denied').length;
  const errorEvents = auditLogs.filter((log) => log.outcome === 'error').length;
  const rows = auditLogs.slice(0, 25).map((log) => [
    formatTimestamp(log.timestamp),
    log.action,
    log.outcome,
    String(log.statusCode),
    log.actorId ?? 'system',
  ]);

  return {
    reportId: 'auditActivity',
    cards: [
      { label: 'Audit events', value: formatNumber(auditLogs.length) },
      { label: 'Denied events', value: formatNumber(deniedEvents) },
      { label: 'Error events', value: formatNumber(errorEvents) },
      { label: 'Unique actors', value: formatNumber(getUniqueCount(auditLogs.map((log) => log.actorId ?? 'system'))) },
    ],
    table: {
      columns: ['Timestamp', 'Action', 'Outcome', 'Status', 'Actor'],
      rows,
      emptyMessage: 'No audit activity in the selected window.',
    },
  };
}

function buildWorkspaceAdoptionDetail(visits: ReportPageVisit[]): AdminReportDetail {
  const adminVisits = visits.filter((visit) => isAdminPagePath(visit.pathname));
  const dailyBuckets = new Map<string, { visits: number; users: Set<string> }>();
  const pathCounts = new Map<string, number>();

  for (const visit of adminVisits) {
    const day = visit.visitedAt.toISOString().slice(0, 10);
    const bucket = dailyBuckets.get(day) ?? { visits: 0, users: new Set<string>() };
    bucket.visits += 1;
    bucket.users.add(visit.userId);
    dailyBuckets.set(day, bucket);
    pathCounts.set(visit.pathname, (pathCounts.get(visit.pathname) ?? 0) + 1);
  }

  const topPath = [...pathCounts.entries()].sort((left, right) => right[1] - left[1])[0];
  const rows = [...dailyBuckets.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([day, bucket]) => [day, formatNumber(bucket.visits), formatNumber(bucket.users.size)]);

  return {
    reportId: 'workspaceAdoption',
    cards: [
      { label: 'Admin visits', value: formatNumber(adminVisits.length) },
      { label: 'Unique admins', value: formatNumber(getUniqueCount(adminVisits.map((visit) => visit.userId))) },
      { label: 'Tracked admin paths', value: formatNumber(pathCounts.size) },
      { label: 'Top path', value: topPath ? `${topPath[0]} (${formatNumber(topPath[1])})` : 'N/A' },
    ],
    table: {
      columns: ['Date', 'Visits', 'Unique visitors'],
      rows,
      emptyMessage: 'No admin workspace visits in the selected window.',
    },
  };
}

function buildSchemaHealthDetail(input: {
  jobs: ReportJob[];
  auditLogs: ReportAuditLog[];
}): AdminReportDetail {
  const failedJobs = input.jobs.filter((job) => job.status === 'failed');
  const retryingJobs = input.jobs.filter((job) => job.status === 'retrying');
  const dataStudioWrites = input.auditLogs.filter((log) => log.action === 'admin.dataStudio.createRecord');
  const unhealthyWrites = dataStudioWrites.filter((log) => log.outcome !== 'allowed');
  const rows = [
    ...failedJobs.slice(0, 10).map((job) => [
      'job',
      job.jobName,
      job.status,
      String(job.attempts),
      formatTimestamp(job.updatedAt),
    ]),
    ...unhealthyWrites.slice(0, 10).map((log) => [
      'audit',
      log.action,
      log.outcome,
      String(log.statusCode),
      formatTimestamp(log.timestamp),
    ]),
  ];

  return {
    reportId: 'schemaHealth',
    cards: [
      { label: 'Failed jobs', value: formatNumber(failedJobs.length) },
      { label: 'Retrying jobs', value: formatNumber(retryingJobs.length) },
      { label: 'Data studio writes', value: formatNumber(dataStudioWrites.length) },
      { label: 'Unhealthy writes', value: formatNumber(unhealthyWrites.length) },
    ],
    table: {
      columns: ['Source', 'Name', 'Status', 'Attempts / Code', 'Updated'],
      rows,
      emptyMessage: 'No recent schema or job issues in the selected window.',
    },
  };
}

async function loadReportInputs(window: AdminReportWindow, deps: AdminReportDeps) {
  const since = getWindowStart(window);
  let usersData: ReportUser[] = [];
  let auditLogs: ReportAuditLog[] = [];
  let visits: ReportPageVisit[] = [];
  let jobs: ReportJob[] = [];

  try {
    [usersData, auditLogs, visits, jobs] = await Promise.all([
      deps.listUsers(),
      deps.listAuditLogsSince(since),
      deps.listPageVisitsSince(since),
      deps.listJobsSince(since),
    ]);
  } catch (error) {
    if (!shouldUseDatabaseReadFallback(error)) {
      throw error;
    }
  }

  return {
    since,
    users: usersData,
    auditLogs,
    visits,
    jobs,
  };
}

export async function getAdminReportSummaryUseCase(
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportSummary> {
  const deps = await depsPromise;
  const { users: usersData, auditLogs, visits, jobs } = await loadReportInputs(window, deps);
  const adminVisits = visits.filter((visit) => isAdminPagePath(visit.pathname));
  const deniedAdminActions = auditLogs.filter((log) => isAdminAction(log.action) && ['denied', 'rate_limited'].includes(log.outcome));

  return {
    metrics: [
      {
        label: 'Admin accounts',
        value: formatNumber(usersData.filter((user) => isPrivilegedAdminRole(user.role)).length),
        detail: `Locked accounts: ${formatNumber(usersData.filter((user) => user.lockoutUntil && user.lockoutUntil.getTime() > Date.now()).length)}`,
      },
      {
        label: 'Denied admin actions',
        value: formatNumber(deniedAdminActions.length),
        detail: `Audit events in ${window}: ${formatNumber(auditLogs.length)}`,
      },
      {
        label: 'Admin visits',
        value: formatNumber(adminVisits.length),
        detail: `Failed jobs in ${window}: ${formatNumber(jobs.filter((job) => job.status === 'failed').length)}`,
      },
    ],
  };
}

export async function getAdminReportDetailUseCase(
  reportId: AdminReportId,
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportDetail> {
  assertReportId(reportId);
  const deps = await depsPromise;
  const { users: usersData, auditLogs, visits, jobs } = await loadReportInputs(window, deps);

  switch (reportId) {
    case 'securityAccess':
      return buildSecurityAccessDetail({ users: usersData, auditLogs });
    case 'auditActivity':
      return buildAuditActivityDetail(auditLogs);
    case 'workspaceAdoption':
      return buildWorkspaceAdoptionDetail(visits);
    case 'schemaHealth':
      return buildSchemaHealthDetail({ jobs, auditLogs });
    default:
      throw new Error(`Unsupported admin report id "${String(reportId)}".`);
  }
}

export async function exportAdminReportUseCase(
  reportId: AdminReportId,
  window: AdminReportWindow,
  format: AdminReportFormat,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportExport> {
  const detail = await getAdminReportDetailUseCase(reportId, window, depsPromise);
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
