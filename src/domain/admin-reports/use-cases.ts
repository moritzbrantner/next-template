import type { AppRole } from '@/lib/authorization';
import { stripLocaleFromPathname } from '@/i18n/routing';
import { getDb } from '@/src/db/client';
import { shouldUseDatabaseReadFallback } from '@/src/site-config/service';

export const adminReportIds = ['securityAccess', 'auditActivity', 'workspaceAdoption', 'schemaHealth'] as const;
export type AdminReportId = (typeof adminReportIds)[number];

export const adminReportWindows = ['24h', '7d', '30d'] as const;
export type AdminReportWindow = (typeof adminReportWindows)[number];

export type AdminReportFormat = 'json' | 'csv';

export type AdminWorkspaceKey = 'overview' | 'content' | 'reports' | 'users' | 'systemSettings' | 'dataStudio';

export type AdminReportStatus = 'live' | 'degraded';
export type AdminReportTone = 'neutral' | 'positive' | 'warning' | 'critical';

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
  metadata?: Record<string, unknown>;
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

export type AdminReportMetricChange = {
  direction: 'up' | 'down' | 'flat';
  value: string;
  detail: string;
  rawDelta: number;
  percentChange: number | null;
};

export type AdminReportMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  href?: string;
  tone?: AdminReportTone;
  change?: AdminReportMetricChange;
};

export type AdminReportCard = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: AdminReportTone;
};

export type AdminReportSeries = {
  id: string;
  title: string;
  description: string;
  type: 'line' | 'bar' | 'area' | 'sparkline';
  xKey: string;
  data: Array<Record<string, number | string>>;
  categories: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  emptyMessage: string;
};

export type AdminReportBreakdown = {
  id: string;
  title: string;
  description: string;
  rows: Array<{
    label: string;
    value: string;
    detail?: string;
    tone?: AdminReportTone;
  }>;
  emptyMessage: string;
};

export type AdminReportTable = {
  columns: string[];
  rows: string[][];
  emptyMessage: string;
};

export type AdminReportDetail = {
  reportId: AdminReportId;
  generatedAt: string;
  window: AdminReportWindow;
  status: AdminReportStatus;
  message?: string;
  cards: AdminReportCard[];
  series: AdminReportSeries[];
  breakdowns: AdminReportBreakdown[];
  table: AdminReportTable;
};

export type AdminReportSummary = {
  generatedAt: string;
  window: AdminReportWindow;
  status: AdminReportStatus;
  message?: string;
  metrics: AdminReportMetric[];
  series: AdminReportSeries[];
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

type ReportWindowData = {
  auditLogs: ReportAuditLog[];
  visits: ReportPageVisit[];
  jobs: ReportJob[];
};

type LoadedReportInputs = {
  generatedAt: Date;
  window: AdminReportWindow;
  status: AdminReportStatus;
  message?: string;
  users: ReportUser[];
  current: ReportWindowData;
  previous: ReportWindowData;
};

const numberFormatter = new Intl.NumberFormat('en-US');
const signedNumberFormatter = new Intl.NumberFormat('en-US', {
  signDisplay: 'always',
  maximumFractionDigits: 0,
});
const signedPercentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  signDisplay: 'always',
  maximumFractionDigits: 0,
});

const ADMIN_REPORT_LINKS: Record<AdminReportId, string> = {
  securityAccess: '/admin/reports/securityAccess',
  auditActivity: '/admin/reports/auditActivity',
  workspaceAdoption: '/admin/reports/workspaceAdoption',
  schemaHealth: '/admin/reports/schemaHealth',
};

const ADMIN_WORKSPACE_SEGMENTS: Record<Exclude<AdminWorkspaceKey, 'overview'>, string> = {
  content: 'content',
  reports: 'reports',
  users: 'users',
  systemSettings: 'system-settings',
  dataStudio: 'data-studio',
};

const ADMIN_WORKSPACE_LABELS: Record<AdminWorkspaceKey, string> = {
  overview: 'Overview',
  content: 'Content',
  reports: 'Reports',
  users: 'Users',
  systemSettings: 'System settings',
  dataStudio: 'Data studio',
};

const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  indigo: '#6366f1',
  zinc: '#71717a',
} as const;

export function isAdminReportId(value: string): value is AdminReportId {
  return adminReportIds.includes(value as AdminReportId);
}

export function isAdminReportWindow(value: string): value is AdminReportWindow {
  return adminReportWindows.includes(value as AdminReportWindow);
}

function getWindowDurationMs(window: AdminReportWindow) {
  switch (window) {
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '7d':
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

function getWindowStart(window: AdminReportWindow, end = new Date()) {
  return new Date(end.getTime() - getWindowDurationMs(window));
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits,
  }).format(value);
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

export function stripLocalePrefix(pathname: string) {
  return stripLocaleFromPathname(pathname);
}

export function getAdminWorkspaceKey(pathname: string): AdminWorkspaceKey | null {
  const normalizedPath = stripLocalePrefix(pathname).split(/[?#]/)[0] || '/';

  if (normalizedPath === '/admin' || normalizedPath === '/admin/') {
    return 'overview';
  }

  if (!normalizedPath.startsWith('/admin/')) {
    return null;
  }

  for (const [workspaceKey, segment] of Object.entries(ADMIN_WORKSPACE_SEGMENTS) as Array<
    [Exclude<AdminWorkspaceKey, 'overview'>, string]
  >) {
    if (normalizedPath === `/admin/${segment}` || normalizedPath.startsWith(`/admin/${segment}/`)) {
      return workspaceKey;
    }
  }

  return null;
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
      const rows = await getDb().query.securityAuditLogs.findMany({
        where: (table, { gte }) => gte(table.timestamp, since),
        orderBy: (table, { desc }) => [desc(table.timestamp)],
      });

      return rows.map((row) => ({
        ...row,
        metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {},
      }));
    },
    listPageVisitsSince: async (since) => {
      return getDb().query.pageVisits.findMany({
        where: (table, { gte }) => gte(table.visitedAt, since),
        orderBy: (table, { desc }) => [desc(table.visitedAt)],
      });
    },
    listJobsSince: async (since) => {
      return getDb().query.jobOutbox.findMany({
        where: (table, { gte }) => gte(table.updatedAt, since),
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      });
    },
  };
}

function filterByWindow<T>(records: T[], getDate: (record: T) => Date, start: Date, end: Date) {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return records.filter((record) => {
    const timestamp = getDate(record).getTime();
    return timestamp >= startTime && timestamp < endTime;
  });
}

function getReportLoadErrorMessage(errors: unknown[]) {
  if (errors.some((error) => shouldUseDatabaseReadFallback(error))) {
    return 'Data unavailable because analytics storage could not be read.';
  }

  return 'Data unavailable because live report inputs could not be loaded.';
}

function emptyWindowData(): ReportWindowData {
  return {
    auditLogs: [],
    visits: [],
    jobs: [],
  };
}

async function loadReportInputs(
  window: AdminReportWindow,
  deps: AdminReportDeps,
  options?: { includePreviousWindow?: boolean; now?: Date },
): Promise<LoadedReportInputs> {
  const generatedAt = options?.now ?? new Date();
  const includePreviousWindow = options?.includePreviousWindow ?? false;
  const currentStart = getWindowStart(window, generatedAt);
  const previousStart = includePreviousWindow
    ? new Date(currentStart.getTime() - getWindowDurationMs(window))
    : currentStart;

  const [usersResult, auditLogsResult, visitsResult, jobsResult] = await Promise.allSettled([
    deps.listUsers(),
    deps.listAuditLogsSince(previousStart),
    deps.listPageVisitsSince(previousStart),
    deps.listJobsSince(previousStart),
  ]);

  const errors = [usersResult, auditLogsResult, visitsResult, jobsResult]
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason);

  if (errors.length > 0) {
    return {
      generatedAt,
      window,
      status: 'degraded',
      message: getReportLoadErrorMessage(errors),
      users: [],
      current: emptyWindowData(),
      previous: emptyWindowData(),
    };
  }

  const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
  const auditLogs = auditLogsResult.status === 'fulfilled' ? auditLogsResult.value : [];
  const visits = visitsResult.status === 'fulfilled' ? visitsResult.value : [];
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : [];

  return {
    generatedAt,
    window,
    status: 'live',
    users,
    current: {
      auditLogs: filterByWindow(auditLogs, (record) => record.timestamp, currentStart, generatedAt),
      visits: filterByWindow(visits, (record) => record.visitedAt, currentStart, generatedAt),
      jobs: filterByWindow(jobs, (record) => record.updatedAt, currentStart, generatedAt),
    },
    previous: includePreviousWindow
      ? {
          auditLogs: filterByWindow(auditLogs, (record) => record.timestamp, previousStart, currentStart),
          visits: filterByWindow(visits, (record) => record.visitedAt, previousStart, currentStart),
          jobs: filterByWindow(jobs, (record) => record.updatedAt, previousStart, currentStart),
        }
      : emptyWindowData(),
  };
}

function buildMetricChange(current: number, previous: number, window: AdminReportWindow): AdminReportMetricChange {
  const rawDelta = current - previous;
  const percentChange = previous === 0 ? null : rawDelta / previous;

  return {
    direction: rawDelta === 0 ? 'flat' : rawDelta > 0 ? 'up' : 'down',
    value: signedNumberFormatter.format(rawDelta),
    detail:
      percentChange === null
        ? `vs previous ${window}; no prior baseline.`
        : `vs previous ${window} (${signedPercentFormatter.format(percentChange)})`,
    rawDelta,
    percentChange,
  };
}

function createUnavailableMetric(
  id: string,
  label: string,
  href: string,
  message: string,
): AdminReportMetric {
  return {
    id,
    label,
    value: 'Data unavailable',
    detail: message,
    href,
    tone: 'warning',
  };
}

function createUnavailableCard(id: string, label: string, message: string): AdminReportCard {
  return {
    id,
    label,
    value: 'Data unavailable',
    detail: message,
    tone: 'warning',
  };
}

function toIsoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getUtcDayStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function listUtcDays(start: Date, end: Date) {
  const days: string[] = [];
  let cursor = getUtcDayStart(start);
  const endDay = getUtcDayStart(end);

  while (cursor.getTime() <= endDay.getTime()) {
    days.push(toIsoDay(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return days;
}

function buildDailySeries(
  title: string,
  description: string,
  start: Date,
  end: Date,
  categories: AdminReportSeries['categories'],
  emptyMessage: string,
  reducer: (row: Record<string, number | string>, day: string) => void,
  type: AdminReportSeries['type'] = 'line',
): AdminReportSeries {
  const data = listUtcDays(start, end).map((day) => {
    const row = Object.fromEntries(
      categories.map((category) => [category.key, 0]),
    ) as Record<string, number | string>;
    row.label = day;
    reducer(row, day);
    return row;
  });

  return {
    id: title.toLowerCase().replaceAll(/\s+/g, '-'),
    title,
    description,
    type,
    xKey: 'label',
    data,
    categories,
    emptyMessage,
  };
}

function buildRankedBreakdown(
  id: string,
  title: string,
  description: string,
  rows: AdminReportBreakdown['rows'],
  emptyMessage: string,
): AdminReportBreakdown {
  return {
    id,
    title,
    description,
    rows,
    emptyMessage,
  };
}

function getAdminWorkspaceLabel(workspaceKey: AdminWorkspaceKey) {
  return ADMIN_WORKSPACE_LABELS[workspaceKey];
}

function normalizeAdminVisits(visits: ReportPageVisit[]) {
  return visits
    .map((visit) => {
      const workspaceKey = getAdminWorkspaceKey(visit.pathname);

      if (!workspaceKey) {
        return null;
      }

      return {
        ...visit,
        workspaceKey,
        normalizedPath: stripLocalePrefix(visit.pathname).split(/[?#]/)[0] || '/',
      };
    })
    .filter((visit): visit is ReportPageVisit & { workspaceKey: AdminWorkspaceKey; normalizedPath: string } => Boolean(visit));
}

function getMetadataValue(log: ReportAuditLog, key: string) {
  const metadataValue = log.metadata?.[key];
  return typeof metadataValue === 'string' && metadataValue.length > 0 ? metadataValue : null;
}

function createDegradedSummary(window: AdminReportWindow, generatedAt: Date, message: string): AdminReportSummary {
  return {
    generatedAt: generatedAt.toISOString(),
    window,
    status: 'degraded',
    message,
    metrics: [
      createUnavailableMetric('deniedAdminActions', 'Denied admin actions', ADMIN_REPORT_LINKS.securityAccess, message),
      createUnavailableMetric('activeAdminUsers', 'Active admin users', ADMIN_REPORT_LINKS.workspaceAdoption, message),
      createUnavailableMetric('adminVisits', 'Admin visits', ADMIN_REPORT_LINKS.workspaceAdoption, message),
      createUnavailableMetric('failedRetryingJobs', 'Failed or retrying jobs', ADMIN_REPORT_LINKS.schemaHealth, message),
    ],
    series: [
      {
        id: 'admin-visits-sparkline',
        title: 'Admin visit trend',
        description: 'Live admin visit volume over time.',
        type: 'sparkline',
        xKey: 'label',
        data: [],
        categories: [{ key: 'visits', label: 'Visits', color: CHART_COLORS.emerald }],
        emptyMessage: message,
      },
    ],
  };
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

function buildSecurityAccessDetail(input: LoadedReportInputs): AdminReportDetail {
  const now = input.generatedAt.getTime();
  const lockedUsers = input.users.filter((user) => user.lockoutUntil && user.lockoutUntil.getTime() > now);
  const incidents = input.current.auditLogs.filter(
    (log) => isAdminAction(log.action) && (log.outcome === 'denied' || log.outcome === 'rate_limited'),
  );
  const deniedCount = incidents.filter((log) => log.outcome === 'denied').length;
  const rateLimitedCount = incidents.filter((log) => log.outcome === 'rate_limited').length;
  const incidentCountsByDay = new Map<string, { denied: number; rateLimited: number }>();
  const actionCounts = new Map<string, number>();
  const actorCounts = new Map<string, number>();

  for (const incident of incidents) {
    const day = toIsoDay(incident.timestamp);
    const bucket = incidentCountsByDay.get(day) ?? { denied: 0, rateLimited: 0 };

    if (incident.outcome === 'rate_limited') {
      bucket.rateLimited += 1;
    } else {
      bucket.denied += 1;
    }

    incidentCountsByDay.set(day, bucket);
    actionCounts.set(incident.action, (actionCounts.get(incident.action) ?? 0) + 1);

    const actorKey = incident.actorId ?? 'system';
    actorCounts.set(actorKey, (actorCounts.get(actorKey) ?? 0) + 1);
  }

  const series = buildDailySeries(
    'Denied and rate-limited actions',
    'Daily trend of denied and rate-limited admin actions.',
    getWindowStart(input.window, input.generatedAt),
    input.generatedAt,
    [
      { key: 'denied', label: 'Denied', color: CHART_COLORS.rose },
      { key: 'rateLimited', label: 'Rate limited', color: CHART_COLORS.amber },
    ],
    'No denied or rate-limited admin actions in the selected window.',
    (row, day) => {
      const bucket = incidentCountsByDay.get(day);
      row.denied = bucket?.denied ?? 0;
      row.rateLimited = bucket?.rateLimited ?? 0;
    },
    'area',
  );

  const actionRows = [...actionCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map<AdminReportBreakdown['rows'][number]>(([action, count]) => ({
      label: action,
      value: formatNumber(count),
      tone: count >= 5 ? 'critical' : 'warning',
    }));
  const actorRows = [...actorCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map<AdminReportBreakdown['rows'][number]>(([actor, count]) => ({
      label: actor,
      value: formatNumber(count),
      tone: count >= 5 ? 'critical' : 'warning',
    }));
  const rows = incidents.slice(0, 20).map((log) => [
    formatTimestamp(log.timestamp),
    log.action,
    log.outcome,
    String(log.statusCode),
    log.actorId ?? 'system',
  ]);

  return {
    reportId: 'securityAccess',
    generatedAt: input.generatedAt.toISOString(),
    window: input.window,
    status: 'live',
    cards: [
      {
        id: 'adminAccounts',
        label: 'Admin accounts',
        value: formatNumber(input.users.filter((user) => isPrivilegedAdminRole(user.role)).length),
      },
      {
        id: 'lockedAccounts',
        label: 'Locked accounts',
        value: formatNumber(lockedUsers.length),
        detail: lockedUsers.length > 0 ? 'Accounts currently under lockout.' : 'No active lockouts.',
        tone: lockedUsers.length > 0 ? 'warning' : 'positive',
      },
      {
        id: 'deniedAdminActions',
        label: 'Denied admin actions',
        value: formatNumber(deniedCount),
        tone: deniedCount > 0 ? 'critical' : 'positive',
      },
      {
        id: 'rateLimitedAdminActions',
        label: 'Rate-limited actions',
        value: formatNumber(rateLimitedCount),
        tone: rateLimitedCount > 0 ? 'warning' : 'positive',
      },
    ],
    series: [series],
    breakdowns: [
      buildRankedBreakdown(
        'security-actions',
        'Denied actions by endpoint',
        'Which admin actions generated the most denials or rate limits.',
        actionRows,
        'No denied or rate-limited actions in the selected window.',
      ),
      buildRankedBreakdown(
        'security-actors',
        'Actors with the most incidents',
        'Top actors involved in denied or rate-limited requests.',
        actorRows,
        'No denied or rate-limited actors in the selected window.',
      ),
    ],
    table: {
      columns: ['Timestamp', 'Action', 'Outcome', 'Status', 'Actor'],
      rows,
      emptyMessage: 'No denied or rate-limited admin actions in the selected window.',
    },
  };
}

function buildAuditActivityDetail(input: LoadedReportInputs): AdminReportDetail {
  const auditLogs = input.current.auditLogs;
  const denialCount = auditLogs.filter((log) => log.outcome === 'denied').length;
  const errorCount = auditLogs.filter((log) => log.outcome === 'error').length;
  const rateLimitedCount = auditLogs.filter((log) => log.outcome === 'rate_limited').length;
  const riskyActionCounts = new Map<string, number>();
  const outcomeCountsByDay = new Map<string, Record<'allowed' | 'denied' | 'error' | 'rateLimited', number>>();

  for (const log of auditLogs) {
    const day = toIsoDay(log.timestamp);
    const bucket = outcomeCountsByDay.get(day) ?? { allowed: 0, denied: 0, error: 0, rateLimited: 0 };

    if (log.outcome === 'denied') {
      bucket.denied += 1;
      riskyActionCounts.set(log.action, (riskyActionCounts.get(log.action) ?? 0) + 1);
    } else if (log.outcome === 'error') {
      bucket.error += 1;
      riskyActionCounts.set(log.action, (riskyActionCounts.get(log.action) ?? 0) + 1);
    } else if (log.outcome === 'rate_limited') {
      bucket.rateLimited += 1;
      riskyActionCounts.set(log.action, (riskyActionCounts.get(log.action) ?? 0) + 1);
    } else {
      bucket.allowed += 1;
    }

    outcomeCountsByDay.set(day, bucket);
  }

  const totalEvents = auditLogs.length;
  const series = buildDailySeries(
    'Audit activity by outcome',
    'Daily audit volume split by outcome.',
    getWindowStart(input.window, input.generatedAt),
    input.generatedAt,
    [
      { key: 'allowed', label: 'Allowed', color: CHART_COLORS.emerald },
      { key: 'denied', label: 'Denied', color: CHART_COLORS.rose },
      { key: 'error', label: 'Error', color: CHART_COLORS.indigo },
      { key: 'rateLimited', label: 'Rate limited', color: CHART_COLORS.amber },
    ],
    'No audit activity in the selected window.',
    (row, day) => {
      const bucket = outcomeCountsByDay.get(day);
      row.allowed = bucket?.allowed ?? 0;
      row.denied = bucket?.denied ?? 0;
      row.error = bucket?.error ?? 0;
      row.rateLimited = bucket?.rateLimited ?? 0;
    },
    'line',
  );

  const riskyRows = [...riskyActionCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map<AdminReportBreakdown['rows'][number]>(([action, count]) => ({
      label: action,
      value: formatNumber(count),
      tone: count >= 5 ? 'critical' : 'warning',
    }));
  const shareRows: AdminReportBreakdown['rows'] = [
    {
      label: 'Denied share',
      value: totalEvents === 0 ? '0%' : formatPercent(denialCount / totalEvents),
      detail: `${formatNumber(denialCount)} of ${formatNumber(totalEvents)} events`,
      tone: denialCount > 0 ? 'warning' : 'positive',
    },
    {
      label: 'Error share',
      value: totalEvents === 0 ? '0%' : formatPercent(errorCount / totalEvents),
      detail: `${formatNumber(errorCount)} of ${formatNumber(totalEvents)} events`,
      tone: errorCount > 0 ? 'warning' : 'positive',
    },
    {
      label: 'Rate-limited share',
      value: totalEvents === 0 ? '0%' : formatPercent(rateLimitedCount / totalEvents),
      detail: `${formatNumber(rateLimitedCount)} of ${formatNumber(totalEvents)} events`,
      tone: rateLimitedCount > 0 ? 'warning' : 'positive',
    },
  ];
  const rows = auditLogs.slice(0, 25).map((log) => [
    formatTimestamp(log.timestamp),
    log.action,
    log.outcome,
    String(log.statusCode),
    log.actorId ?? 'system',
  ]);

  return {
    reportId: 'auditActivity',
    generatedAt: input.generatedAt.toISOString(),
    window: input.window,
    status: 'live',
    cards: [
      {
        id: 'auditEvents',
        label: 'Audit events',
        value: formatNumber(totalEvents),
      },
      {
        id: 'uniqueActors',
        label: 'Unique actors',
        value: formatNumber(getUniqueCount(auditLogs.map((log) => log.actorId ?? 'system'))),
      },
      {
        id: 'denialShare',
        label: 'Denial share',
        value: totalEvents === 0 ? '0%' : formatPercent(denialCount / totalEvents),
        detail: `${formatNumber(denialCount)} denied events`,
        tone: denialCount > 0 ? 'warning' : 'positive',
      },
      {
        id: 'errorShare',
        label: 'Error share',
        value: totalEvents === 0 ? '0%' : formatPercent(errorCount / totalEvents),
        detail: `${formatNumber(errorCount)} error events`,
        tone: errorCount > 0 ? 'critical' : 'positive',
      },
    ],
    series: [series],
    breakdowns: [
      buildRankedBreakdown(
        'risky-actions',
        'Top risky actions',
        'Actions with the highest volume of denied, rate-limited, or error outcomes.',
        riskyRows,
        'No risky actions in the selected window.',
      ),
      buildRankedBreakdown(
        'audit-outcome-share',
        'Outcome shares',
        'How the current audit window is split across risky outcomes.',
        shareRows,
        'No audit activity in the selected window.',
      ),
    ],
    table: {
      columns: ['Timestamp', 'Action', 'Outcome', 'Status', 'Actor'],
      rows,
      emptyMessage: 'No audit activity in the selected window.',
    },
  };
}

function buildWorkspaceAdoptionDetail(input: LoadedReportInputs): AdminReportDetail {
  const adminVisits = normalizeAdminVisits(input.current.visits);
  const visitsByWorkspace = new Map<AdminWorkspaceKey, { visits: number; users: Set<string> }>();
  const pathCounts = new Map<string, { visits: number; users: Set<string>; workspace: AdminWorkspaceKey }>();
  const userVisitCounts = new Map<string, number>();

  for (const visit of adminVisits) {
    const workspaceBucket = visitsByWorkspace.get(visit.workspaceKey) ?? { visits: 0, users: new Set<string>() };
    workspaceBucket.visits += 1;
    workspaceBucket.users.add(visit.userId);
    visitsByWorkspace.set(visit.workspaceKey, workspaceBucket);

    const pathBucket = pathCounts.get(visit.normalizedPath) ?? {
      visits: 0,
      users: new Set<string>(),
      workspace: visit.workspaceKey,
    };
    pathBucket.visits += 1;
    pathBucket.users.add(visit.userId);
    pathCounts.set(visit.normalizedPath, pathBucket);

    userVisitCounts.set(visit.userId, (userVisitCounts.get(visit.userId) ?? 0) + 1);
  }

  const uniqueAdmins = getUniqueCount(adminVisits.map((visit) => visit.userId));
  const repeatVisitors = [...userVisitCounts.values()].filter((count) => count > 1).length;
  const repeatVisitorRatio = uniqueAdmins === 0 ? 0 : repeatVisitors / uniqueAdmins;
  const topWorkspace = [...visitsByWorkspace.entries()].sort((left, right) => right[1].visits - left[1].visits)[0];
  const workspaceData = (
    ['overview', 'content', 'reports', 'users', 'systemSettings', 'dataStudio'] as AdminWorkspaceKey[]
  ).map((workspaceKey) => {
    const bucket = visitsByWorkspace.get(workspaceKey);
    return {
      label: getAdminWorkspaceLabel(workspaceKey),
      visits: bucket?.visits ?? 0,
      uniqueUsers: bucket?.users.size ?? 0,
    };
  });

  const workspaceRows = [...visitsByWorkspace.entries()]
    .sort((left, right) => right[1].visits - left[1].visits || left[0].localeCompare(right[0]))
    .map<AdminReportBreakdown['rows'][number]>(([workspaceKey, bucket]) => ({
      label: getAdminWorkspaceLabel(workspaceKey),
      value: formatNumber(bucket.visits),
      detail: `${formatNumber(bucket.users.size)} unique admins`,
    }));
  const uniqueUserRows = [...visitsByWorkspace.entries()]
    .sort((left, right) => right[1].users.size - left[1].users.size || left[0].localeCompare(right[0]))
    .map<AdminReportBreakdown['rows'][number]>(([workspaceKey, bucket]) => ({
      label: getAdminWorkspaceLabel(workspaceKey),
      value: formatNumber(bucket.users.size),
      detail: `${formatNumber(bucket.visits)} visits`,
    }));
  const tableRows = [...pathCounts.entries()]
    .sort((left, right) => right[1].visits - left[1].visits || left[0].localeCompare(right[0]))
    .slice(0, 20)
    .map(([path, bucket]) => [
      path,
      getAdminWorkspaceLabel(bucket.workspace),
      formatNumber(bucket.visits),
      formatNumber(bucket.users.size),
    ]);

  return {
    reportId: 'workspaceAdoption',
    generatedAt: input.generatedAt.toISOString(),
    window: input.window,
    status: 'live',
    cards: [
      {
        id: 'adminVisits',
        label: 'Admin visits',
        value: formatNumber(adminVisits.length),
      },
      {
        id: 'activeAdminUsers',
        label: 'Active admin users',
        value: formatNumber(uniqueAdmins),
      },
      {
        id: 'repeatVisitorRatio',
        label: 'Repeat-visitor ratio',
        value: formatPercent(repeatVisitorRatio),
        detail: `${formatNumber(repeatVisitors)} admins visited more than once`,
        tone: repeatVisitorRatio >= 0.5 ? 'positive' : uniqueAdmins === 0 ? 'neutral' : 'warning',
      },
      {
        id: 'topWorkspace',
        label: 'Top workspace',
        value: topWorkspace ? getAdminWorkspaceLabel(topWorkspace[0]) : 'N/A',
        detail: topWorkspace ? `${formatNumber(topWorkspace[1].visits)} visits` : 'No admin visits in the selected window.',
      },
    ],
    series: [
      {
        id: 'workspace-adoption',
        title: 'Visits by workspace',
        description: 'Visits and unique admins grouped by normalized admin workspace.',
        type: 'bar',
        xKey: 'label',
        data: workspaceData,
        categories: [
          { key: 'visits', label: 'Visits', color: CHART_COLORS.emerald },
          { key: 'uniqueUsers', label: 'Unique admins', color: CHART_COLORS.blue },
        ],
        emptyMessage: 'No admin workspace visits in the selected window.',
      },
    ],
    breakdowns: [
      buildRankedBreakdown(
        'workspace-visits',
        'Workspace visits',
        'Total visit volume per admin workspace.',
        workspaceRows,
        'No admin workspace visits in the selected window.',
      ),
      buildRankedBreakdown(
        'workspace-unique-admins',
        'Unique admins by workspace',
        'How many distinct admins used each workspace.',
        uniqueUserRows,
        'No admin workspace visits in the selected window.',
      ),
    ],
    table: {
      columns: ['Path', 'Workspace', 'Visits', 'Unique admins'],
      rows: tableRows,
      emptyMessage: 'No admin workspace visits in the selected window.',
    },
  };
}

function buildSchemaHealthDetail(input: LoadedReportInputs): AdminReportDetail {
  const unhealthyJobs = input.current.jobs.filter((job) => job.status === 'failed' || job.status === 'retrying');
  const failedJobs = unhealthyJobs.filter((job) => job.status === 'failed');
  const retryingJobs = unhealthyJobs.filter((job) => job.status === 'retrying');
  const writeFailures = input.current.auditLogs.filter(
    (log) => log.action === 'admin.dataStudio.createRecord' && log.outcome !== 'allowed',
  );
  const jobsByName = new Map<string, { failed: number; retrying: number; latestError: string | null; latestUpdatedAt: Date | null }>();
  const writeFailuresByTarget = new Map<string, { count: number; tableName: string; action: string }>();

  for (const job of unhealthyJobs) {
    const bucket = jobsByName.get(job.jobName) ?? {
      failed: 0,
      retrying: 0,
      latestError: null,
      latestUpdatedAt: null,
    };

    if (job.status === 'failed') {
      bucket.failed += 1;
    } else if (job.status === 'retrying') {
      bucket.retrying += 1;
    }

    if (!bucket.latestUpdatedAt || bucket.latestUpdatedAt.getTime() < job.updatedAt.getTime()) {
      bucket.latestUpdatedAt = job.updatedAt;
      bucket.latestError = job.lastError;
    }

    jobsByName.set(job.jobName, bucket);
  }

  for (const log of writeFailures) {
    const tableName = getMetadataValue(log, 'tableName') ?? getMetadataValue(log, 'table') ?? 'unknown';
    const action = getMetadataValue(log, 'action') ?? log.action;
    const key = `${tableName}:${action}`;
    const bucket = writeFailuresByTarget.get(key) ?? { count: 0, tableName, action };
    bucket.count += 1;
    writeFailuresByTarget.set(key, bucket);
  }

  const latestFailedJob = failedJobs.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
  const jobRows = [...jobsByName.entries()]
    .sort((left, right) => right[1].failed + right[1].retrying - (left[1].failed + left[1].retrying))
    .map<AdminReportBreakdown['rows'][number]>(([jobName, bucket]) => ({
      label: jobName,
      value: `${formatNumber(bucket.failed)} failed / ${formatNumber(bucket.retrying)} retrying`,
      detail: bucket.latestError ? bucket.latestError : `Updated ${formatTimestamp(bucket.latestUpdatedAt)}`,
      tone: bucket.failed > 0 ? 'critical' : 'warning',
    }));
  const writeRows = [...writeFailuresByTarget.values()]
    .sort((left, right) => right.count - left.count || left.tableName.localeCompare(right.tableName))
    .map<AdminReportBreakdown['rows'][number]>((bucket) => ({
      label: bucket.tableName,
      value: formatNumber(bucket.count),
      detail: bucket.action,
      tone: bucket.count >= 3 ? 'critical' : 'warning',
    }));
  const tableRows = [
    ...unhealthyJobs.slice(0, 12).map((job) => [
      formatTimestamp(job.updatedAt),
      'job',
      job.jobName,
      job.status,
      `attempts ${job.attempts}`,
      job.lastError ?? 'N/A',
    ]),
    ...writeFailures.slice(0, 12).map((log) => [
      formatTimestamp(log.timestamp),
      'write',
      getMetadataValue(log, 'tableName') ?? getMetadataValue(log, 'table') ?? 'unknown',
      log.outcome,
      String(log.statusCode),
      log.actorId ?? 'system',
    ]),
  ].sort((left, right) => right[0].localeCompare(left[0]));

  return {
    reportId: 'schemaHealth',
    generatedAt: input.generatedAt.toISOString(),
    window: input.window,
    status: 'live',
    cards: [
      {
        id: 'failedJobs',
        label: 'Failed jobs',
        value: formatNumber(failedJobs.length),
        tone: failedJobs.length > 0 ? 'critical' : 'positive',
      },
      {
        id: 'retryingJobs',
        label: 'Retrying jobs',
        value: formatNumber(retryingJobs.length),
        tone: retryingJobs.length > 0 ? 'warning' : 'positive',
      },
      {
        id: 'writeFailures',
        label: 'Write failures',
        value: formatNumber(writeFailures.length),
        tone: writeFailures.length > 0 ? 'warning' : 'positive',
      },
      {
        id: 'latestLastError',
        label: 'Latest job error',
        value: latestFailedJob?.jobName ?? 'N/A',
        detail: latestFailedJob?.lastError ?? 'No recent failed jobs.',
        tone: latestFailedJob ? 'critical' : 'positive',
      },
    ],
    series: [
      {
        id: 'schema-health-jobs',
        title: 'Failed and retrying jobs',
        description: 'Current unhealthy jobs grouped by job name.',
        type: 'bar',
        xKey: 'label',
        data: [...jobsByName.entries()].map(([jobName, bucket]) => ({
          label: jobName,
          failed: bucket.failed,
          retrying: bucket.retrying,
        })),
        categories: [
          { key: 'failed', label: 'Failed', color: CHART_COLORS.rose },
          { key: 'retrying', label: 'Retrying', color: CHART_COLORS.amber },
        ],
        emptyMessage: 'No failed or retrying jobs in the selected window.',
      },
    ],
    breakdowns: [
      buildRankedBreakdown(
        'schema-job-health',
        'Job failures by name',
        'Latest unhealthy jobs, grouped by job name.',
        jobRows,
        'No failed or retrying jobs in the selected window.',
      ),
      buildRankedBreakdown(
        'schema-write-failures',
        'Write failures by table/action',
        'Tables and actions with the most failed or denied writes.',
        writeRows,
        'No unhealthy Data Studio writes in the selected window.',
      ),
    ],
    table: {
      columns: ['Timestamp', 'Source', 'Name', 'Status', 'Detail', 'Actor / Error'],
      rows: tableRows,
      emptyMessage: 'No recent schema or job issues in the selected window.',
    },
  };
}

function buildAdminVisitSparkline(visits: ReturnType<typeof normalizeAdminVisits>, window: AdminReportWindow, generatedAt: Date) {
  const countsByDay = new Map<string, number>();

  for (const visit of visits) {
    const day = toIsoDay(visit.visitedAt);
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  return buildDailySeries(
    'Admin visits',
    `Live admin visits across the current ${window} window.`,
    getWindowStart(window, generatedAt),
    generatedAt,
    [{ key: 'visits', label: 'Visits', color: CHART_COLORS.emerald }],
    'No admin visits in the selected window.',
    (row, day) => {
      row.visits = countsByDay.get(day) ?? 0;
    },
    'sparkline',
  );
}

function buildSummaryMetrics(input: LoadedReportInputs): AdminReportMetric[] {
  const currentAdminVisits = normalizeAdminVisits(input.current.visits);
  const previousAdminVisits = normalizeAdminVisits(input.previous.visits);
  const currentDeniedActions = input.current.auditLogs.filter(
    (log) => isAdminAction(log.action) && (log.outcome === 'denied' || log.outcome === 'rate_limited'),
  ).length;
  const previousDeniedActions = input.previous.auditLogs.filter(
    (log) => isAdminAction(log.action) && (log.outcome === 'denied' || log.outcome === 'rate_limited'),
  ).length;
  const currentActiveAdmins = getUniqueCount(currentAdminVisits.map((visit) => visit.userId));
  const previousActiveAdmins = getUniqueCount(previousAdminVisits.map((visit) => visit.userId));
  const currentFailedRetryingJobs = input.current.jobs.filter((job) => job.status === 'failed' || job.status === 'retrying').length;
  const previousFailedRetryingJobs = input.previous.jobs.filter((job) => job.status === 'failed' || job.status === 'retrying').length;

  return [
    {
      id: 'deniedAdminActions',
      label: 'Denied admin actions',
      value: formatNumber(currentDeniedActions),
      detail: 'Denied and rate-limited admin actions in the current window.',
      href: ADMIN_REPORT_LINKS.securityAccess,
      tone: currentDeniedActions >= 10 ? 'critical' : currentDeniedActions > 0 ? 'warning' : 'positive',
      change: buildMetricChange(currentDeniedActions, previousDeniedActions, input.window),
    },
    {
      id: 'activeAdminUsers',
      label: 'Active admin users',
      value: formatNumber(currentActiveAdmins),
      detail: 'Distinct admins who visited a normalized admin workspace.',
      href: ADMIN_REPORT_LINKS.workspaceAdoption,
      tone: currentActiveAdmins === 0 ? 'warning' : 'positive',
      change: buildMetricChange(currentActiveAdmins, previousActiveAdmins, input.window),
    },
    {
      id: 'adminVisits',
      label: 'Admin visits',
      value: formatNumber(currentAdminVisits.length),
      detail: 'Localized admin visits normalized into workspace traffic.',
      href: ADMIN_REPORT_LINKS.workspaceAdoption,
      tone: currentAdminVisits.length === 0 ? 'warning' : 'positive',
      change: buildMetricChange(currentAdminVisits.length, previousAdminVisits.length, input.window),
    },
    {
      id: 'failedRetryingJobs',
      label: 'Failed or retrying jobs',
      value: formatNumber(currentFailedRetryingJobs),
      detail: 'Current unhealthy jobs updated within the selected window.',
      href: ADMIN_REPORT_LINKS.schemaHealth,
      tone: currentFailedRetryingJobs >= 5 ? 'critical' : currentFailedRetryingJobs > 0 ? 'warning' : 'positive',
      change: buildMetricChange(currentFailedRetryingJobs, previousFailedRetryingJobs, input.window),
    },
  ];
}

export async function getAdminReportSummaryUseCase(
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportSummary> {
  const deps = await depsPromise;
  const input = await loadReportInputs(window, deps, { includePreviousWindow: true });

  if (input.status === 'degraded') {
    return createDegradedSummary(window, input.generatedAt, input.message ?? 'Data unavailable.');
  }

  const currentAdminVisits = normalizeAdminVisits(input.current.visits);

  return {
    generatedAt: input.generatedAt.toISOString(),
    window,
    status: 'live',
    metrics: buildSummaryMetrics(input),
    series: [buildAdminVisitSparkline(currentAdminVisits, window, input.generatedAt)],
  };
}

export async function getAdminReportDetailUseCase(
  reportId: AdminReportId,
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportDetail> {
  assertReportId(reportId);
  const deps = await depsPromise;
  const input = await loadReportInputs(window, deps);

  if (input.status === 'degraded') {
    return createDegradedDetail(reportId, window, input.generatedAt, input.message ?? 'Data unavailable.');
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
