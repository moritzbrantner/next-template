import type {
  AdminReportBreakdown,
  AdminReportDetail,
  AdminWorkspaceKey,
} from './contracts';
import {
  buildRankedBreakdown,
  CHART_COLORS,
  formatNumber,
  formatPercent,
  getUniqueCount,
  normalizeAdminVisits,
} from './report-helpers';
import type { LoadedReportInputs } from './report-inputs';

const ADMIN_WORKSPACE_LABELS: Record<AdminWorkspaceKey, string> = {
  overview: 'Overview',
  content: 'Content',
  reports: 'Reports',
  users: 'Users',
  systemSettings: 'System settings',
  dataStudio: 'Data studio',
};

function getAdminWorkspaceLabel(workspaceKey: AdminWorkspaceKey) {
  return ADMIN_WORKSPACE_LABELS[workspaceKey];
}

export function buildWorkspaceAdoptionDetail(
  input: LoadedReportInputs,
): AdminReportDetail {
  const adminVisits = normalizeAdminVisits(input.current.visits);
  const visitsByWorkspace = new Map<
    AdminWorkspaceKey,
    { visits: number; users: Set<string> }
  >();
  const pathCounts = new Map<
    string,
    { visits: number; users: Set<string>; workspace: AdminWorkspaceKey }
  >();
  const userVisitCounts = new Map<string, number>();

  for (const visit of adminVisits) {
    const workspaceBucket = visitsByWorkspace.get(visit.workspaceKey) ?? {
      visits: 0,
      users: new Set<string>(),
    };
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

    userVisitCounts.set(
      visit.userId,
      (userVisitCounts.get(visit.userId) ?? 0) + 1,
    );
  }

  const uniqueAdmins = getUniqueCount(adminVisits.map((visit) => visit.userId));
  const repeatVisitors = [...userVisitCounts.values()].filter(
    (count) => count > 1,
  ).length;
  const repeatVisitorRatio =
    uniqueAdmins === 0 ? 0 : repeatVisitors / uniqueAdmins;
  const topWorkspace = [...visitsByWorkspace.entries()].sort(
    (left, right) => right[1].visits - left[1].visits,
  )[0];
  const workspaceData = (
    [
      'overview',
      'content',
      'reports',
      'users',
      'systemSettings',
      'dataStudio',
    ] as AdminWorkspaceKey[]
  ).map((workspaceKey) => {
    const bucket = visitsByWorkspace.get(workspaceKey);
    return {
      label: getAdminWorkspaceLabel(workspaceKey),
      visits: bucket?.visits ?? 0,
      uniqueUsers: bucket?.users.size ?? 0,
    };
  });

  const workspaceRows = [...visitsByWorkspace.entries()]
    .sort(
      (left, right) =>
        right[1].visits - left[1].visits || left[0].localeCompare(right[0]),
    )
    .map<AdminReportBreakdown['rows'][number]>(([workspaceKey, bucket]) => ({
      label: getAdminWorkspaceLabel(workspaceKey),
      value: formatNumber(bucket.visits),
      detail: `${formatNumber(bucket.users.size)} unique admins`,
    }));
  const uniqueUserRows = [...visitsByWorkspace.entries()]
    .sort(
      (left, right) =>
        right[1].users.size - left[1].users.size ||
        left[0].localeCompare(right[0]),
    )
    .map<AdminReportBreakdown['rows'][number]>(([workspaceKey, bucket]) => ({
      label: getAdminWorkspaceLabel(workspaceKey),
      value: formatNumber(bucket.users.size),
      detail: `${formatNumber(bucket.visits)} visits`,
    }));
  const tableRows = [...pathCounts.entries()]
    .sort(
      (left, right) =>
        right[1].visits - left[1].visits || left[0].localeCompare(right[0]),
    )
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
        tone:
          repeatVisitorRatio >= 0.5
            ? 'positive'
            : uniqueAdmins === 0
              ? 'neutral'
              : 'warning',
      },
      {
        id: 'topWorkspace',
        label: 'Top workspace',
        value: topWorkspace ? getAdminWorkspaceLabel(topWorkspace[0]) : 'N/A',
        detail: topWorkspace
          ? `${formatNumber(topWorkspace[1].visits)} visits`
          : 'No admin visits in the selected window.',
      },
    ],
    series: [
      {
        id: 'workspace-adoption',
        title: 'Visits by workspace',
        description:
          'Visits and unique admins grouped by normalized admin workspace.',
        type: 'bar',
        xKey: 'label',
        data: workspaceData,
        categories: [
          { key: 'visits', label: 'Visits', color: CHART_COLORS.emerald },
          {
            key: 'uniqueUsers',
            label: 'Unique admins',
            color: CHART_COLORS.blue,
          },
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
