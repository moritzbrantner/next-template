import type {
  AdminReportId,
  AdminReportMetric,
  AdminReportMetricChange,
  AdminReportSummary,
  AdminReportWindow,
} from './contracts';
import {
  buildDailySeries,
  CHART_COLORS,
  formatNumber,
  getUniqueCount,
  isAdminAction,
  normalizeAdminVisits,
  toIsoDay,
} from './report-helpers';
import {
  createDefaultDeps,
  getWindowStart,
  loadReportInputs,
  type AdminReportDeps,
  type LoadedReportInputs,
} from './report-inputs';

export type { AdminReportSummary } from './contracts';

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
  navigationJourneys: '/admin/reports/navigationJourneys',
};

function buildMetricChange(
  current: number,
  previous: number,
  window: AdminReportWindow,
): AdminReportMetricChange {
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

function createDegradedSummary(
  window: AdminReportWindow,
  generatedAt: Date,
  message: string,
): AdminReportSummary {
  return {
    generatedAt: generatedAt.toISOString(),
    window,
    status: 'degraded',
    message,
    metrics: [
      createUnavailableMetric(
        'deniedAdminActions',
        'Denied admin actions',
        ADMIN_REPORT_LINKS.securityAccess,
        message,
      ),
      createUnavailableMetric(
        'activeAdminUsers',
        'Active admin users',
        ADMIN_REPORT_LINKS.workspaceAdoption,
        message,
      ),
      createUnavailableMetric(
        'adminVisits',
        'Admin visits',
        ADMIN_REPORT_LINKS.workspaceAdoption,
        message,
      ),
      createUnavailableMetric(
        'failedRetryingJobs',
        'Failed or retrying jobs',
        ADMIN_REPORT_LINKS.schemaHealth,
        message,
      ),
    ],
    series: [
      {
        id: 'admin-visits-sparkline',
        title: 'Admin visit trend',
        description: 'Live admin visit volume over time.',
        type: 'sparkline',
        xKey: 'label',
        data: [],
        categories: [
          { key: 'visits', label: 'Visits', color: CHART_COLORS.emerald },
        ],
        emptyMessage: message,
      },
    ],
  };
}

function buildAdminVisitSparkline(
  visits: ReturnType<typeof normalizeAdminVisits>,
  window: AdminReportWindow,
  generatedAt: Date,
) {
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

function buildSummaryMetrics(
  input: LoadedReportInputs,
  currentAdminVisits: ReturnType<typeof normalizeAdminVisits>,
): AdminReportMetric[] {
  const previousAdminVisits = normalizeAdminVisits(input.previous.visits);
  const currentDeniedActions = input.current.auditLogs.filter(
    (log) =>
      isAdminAction(log.action) &&
      (log.outcome === 'denied' || log.outcome === 'rate_limited'),
  ).length;
  const previousDeniedActions = input.previous.auditLogs.filter(
    (log) =>
      isAdminAction(log.action) &&
      (log.outcome === 'denied' || log.outcome === 'rate_limited'),
  ).length;
  const currentActiveAdmins = getUniqueCount(
    currentAdminVisits.map((visit) => visit.userId),
  );
  const previousActiveAdmins = getUniqueCount(
    previousAdminVisits.map((visit) => visit.userId),
  );
  const currentFailedRetryingJobs = input.current.jobs.filter(
    (job) => job.status === 'failed' || job.status === 'retrying',
  ).length;
  const previousFailedRetryingJobs = input.previous.jobs.filter(
    (job) => job.status === 'failed' || job.status === 'retrying',
  ).length;

  return [
    {
      id: 'deniedAdminActions',
      label: 'Denied admin actions',
      value: formatNumber(currentDeniedActions),
      detail: 'Denied and rate-limited admin actions in the current window.',
      href: ADMIN_REPORT_LINKS.securityAccess,
      tone:
        currentDeniedActions >= 10
          ? 'critical'
          : currentDeniedActions > 0
            ? 'warning'
            : 'positive',
      change: buildMetricChange(
        currentDeniedActions,
        previousDeniedActions,
        input.window,
      ),
    },
    {
      id: 'activeAdminUsers',
      label: 'Active admin users',
      value: formatNumber(currentActiveAdmins),
      detail: 'Distinct admins who visited a normalized admin workspace.',
      href: ADMIN_REPORT_LINKS.workspaceAdoption,
      tone: currentActiveAdmins === 0 ? 'warning' : 'positive',
      change: buildMetricChange(
        currentActiveAdmins,
        previousActiveAdmins,
        input.window,
      ),
    },
    {
      id: 'adminVisits',
      label: 'Admin visits',
      value: formatNumber(currentAdminVisits.length),
      detail: 'Localized admin visits normalized into workspace traffic.',
      href: ADMIN_REPORT_LINKS.workspaceAdoption,
      tone: currentAdminVisits.length === 0 ? 'warning' : 'positive',
      change: buildMetricChange(
        currentAdminVisits.length,
        previousAdminVisits.length,
        input.window,
      ),
    },
    {
      id: 'failedRetryingJobs',
      label: 'Failed or retrying jobs',
      value: formatNumber(currentFailedRetryingJobs),
      detail: 'Current unhealthy jobs updated within the selected window.',
      href: ADMIN_REPORT_LINKS.schemaHealth,
      tone:
        currentFailedRetryingJobs >= 5
          ? 'critical'
          : currentFailedRetryingJobs > 0
            ? 'warning'
            : 'positive',
      change: buildMetricChange(
        currentFailedRetryingJobs,
        previousFailedRetryingJobs,
        input.window,
      ),
    },
  ];
}

export async function getAdminReportSummaryUseCase(
  window: AdminReportWindow,
  depsPromise: Promise<AdminReportDeps> = createDefaultDeps(),
): Promise<AdminReportSummary> {
  const deps = await depsPromise;
  const input = await loadReportInputs(window, deps, {
    includePreviousWindow: true,
  });

  if (input.status === 'degraded') {
    return createDegradedSummary(
      window,
      input.generatedAt,
      input.message ?? 'Data unavailable.',
    );
  }

  const currentAdminVisits = normalizeAdminVisits(input.current.visits);

  return {
    generatedAt: input.generatedAt.toISOString(),
    window,
    status: 'live',
    metrics: buildSummaryMetrics(input, currentAdminVisits),
    series: [
      buildAdminVisitSparkline(currentAdminVisits, window, input.generatedAt),
    ],
  };
}
