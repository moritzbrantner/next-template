import type { AppRole } from '@/lib/authorization';
import { getDb } from '@/src/db/client';
import type { AdminReportStatus, AdminReportWindow } from './contracts';
import { shouldUseDatabaseReadFallback } from '@/src/site-config/service';

type ReportUser = {
  id: string;
  role: AppRole;
  lockoutUntil: Date | null;
};

export type ReportAuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  outcome: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
};

export type ReportPageVisit = {
  id: string;
  userId: string | null;
  trackingVersion: number;
  visitorId: string;
  sessionId: string;
  pathname: string;
  href: string;
  canonicalPath: string;
  routeGroup: string;
  isAuthenticated: boolean;
  previousPathname: string | null;
  previousCanonicalPath: string | null;
  referrerType: string;
  referrerHost: string | null;
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

export type AdminReportDeps = {
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

export type LoadedReportInputs = {
  generatedAt: Date;
  window: AdminReportWindow;
  status: AdminReportStatus;
  message?: string;
  users: ReportUser[];
  current: ReportWindowData;
  previous: ReportWindowData;
};

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

export function getWindowStart(window: AdminReportWindow, end = new Date()) {
  return new Date(end.getTime() - getWindowDurationMs(window));
}

export async function createDefaultDeps(): Promise<AdminReportDeps> {
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
        metadata:
          row.metadata &&
          typeof row.metadata === 'object' &&
          !Array.isArray(row.metadata)
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

function filterByWindow<T>(
  records: T[],
  getDate: (record: T) => Date,
  start: Date,
  end: Date,
) {
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

export async function loadReportInputs(
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

  const [usersResult, auditLogsResult, visitsResult, jobsResult] =
    await Promise.allSettled([
      deps.listUsers(),
      deps.listAuditLogsSince(previousStart),
      deps.listPageVisitsSince(previousStart),
      deps.listJobsSince(previousStart),
    ]);

  const errors = [usersResult, auditLogsResult, visitsResult, jobsResult]
    .filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
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
  const auditLogs =
    auditLogsResult.status === 'fulfilled' ? auditLogsResult.value : [];
  const visits = visitsResult.status === 'fulfilled' ? visitsResult.value : [];
  const jobs = jobsResult.status === 'fulfilled' ? jobsResult.value : [];

  return {
    generatedAt,
    window,
    status: 'live',
    users,
    current: {
      auditLogs: filterByWindow(
        auditLogs,
        (record) => record.timestamp,
        currentStart,
        generatedAt,
      ),
      visits: filterByWindow(
        visits,
        (record) => record.visitedAt,
        currentStart,
        generatedAt,
      ),
      jobs: filterByWindow(
        jobs,
        (record) => record.updatedAt,
        currentStart,
        generatedAt,
      ),
    },
    previous: includePreviousWindow
      ? {
          auditLogs: filterByWindow(
            auditLogs,
            (record) => record.timestamp,
            previousStart,
            currentStart,
          ),
          visits: filterByWindow(
            visits,
            (record) => record.visitedAt,
            previousStart,
            currentStart,
          ),
          jobs: filterByWindow(
            jobs,
            (record) => record.updatedAt,
            previousStart,
            currentStart,
          ),
        }
      : emptyWindowData(),
  };
}
