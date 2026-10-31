import { stripLocaleFromPathname } from '@/i18n/routing';
import {
  classifyNavigationPathname,
  navigationRouteGroups,
} from '@/src/analytics/navigation-classification';

export const adminReportIds = [
  'securityAccess',
  'auditActivity',
  'workspaceAdoption',
  'schemaHealth',
  'navigationJourneys',
] as const;
export type AdminReportId = (typeof adminReportIds)[number];

export const adminReportWindows = ['24h', '7d', '30d'] as const;
export type AdminReportWindow = (typeof adminReportWindows)[number];

export type AdminReportFormat = 'json' | 'csv';
export const navigationReportAudiences = [
  'all',
  'anonymous',
  'authenticated',
] as const;
export type NavigationReportAudience =
  (typeof navigationReportAudiences)[number];
export const navigationReportRouteGroups = [
  'all',
  ...navigationRouteGroups,
] as const;
export type NavigationReportRouteGroupFilter =
  (typeof navigationReportRouteGroups)[number];

export type AdminWorkspaceKey =
  | 'overview'
  | 'content'
  | 'reports'
  | 'users'
  | 'systemSettings'
  | 'dataStudio';

export type AdminReportStatus = 'live' | 'degraded';
export type AdminReportTone = 'neutral' | 'positive' | 'warning' | 'critical';

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
  tableTitle?: string;
  tableDescription?: string;
  filters?: {
    audience: NavigationReportAudience;
    routeGroup: NavigationReportRouteGroupFilter;
    path: string | null;
    pathOptions: string[];
  };
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

const ADMIN_WORKSPACE_SEGMENTS: Record<
  Exclude<AdminWorkspaceKey, 'overview'>,
  string
> = {
  content: 'content',
  reports: 'reports',
  users: 'users',
  systemSettings: 'system-settings',
  dataStudio: 'data-studio',
};

export function isAdminReportId(value: string): value is AdminReportId {
  return adminReportIds.includes(value as AdminReportId);
}

export function isAdminReportWindow(value: string): value is AdminReportWindow {
  return adminReportWindows.includes(value as AdminReportWindow);
}

export function isNavigationReportAudience(
  value: string,
): value is NavigationReportAudience {
  return navigationReportAudiences.includes(value as NavigationReportAudience);
}

export function isNavigationReportRouteGroupFilter(
  value: string,
): value is NavigationReportRouteGroupFilter {
  return navigationReportRouteGroups.includes(
    value as NavigationReportRouteGroupFilter,
  );
}

export function normalizeNavigationReportFilters(input?: {
  audience?: string | null;
  routeGroup?: string | null;
  path?: string | null;
}) {
  const trimmedPath = input?.path?.trim() || null;

  return {
    audience:
      input?.audience && isNavigationReportAudience(input.audience)
        ? input.audience
        : 'all',
    routeGroup:
      input?.routeGroup && isNavigationReportRouteGroupFilter(input.routeGroup)
        ? input.routeGroup
        : 'all',
    path: trimmedPath
      ? classifyNavigationPathname(trimmedPath).canonicalPath
      : null,
  } satisfies {
    audience: NavigationReportAudience;
    routeGroup: NavigationReportRouteGroupFilter;
    path: string | null;
  };
}

export function stripLocalePrefix(pathname: string) {
  return stripLocaleFromPathname(pathname);
}

export function getAdminWorkspaceKey(
  pathname: string,
): AdminWorkspaceKey | null {
  const normalizedPath = stripLocalePrefix(pathname).split(/[?#]/)[0] || '/';

  if (normalizedPath === '/admin' || normalizedPath === '/admin/') {
    return 'overview';
  }

  if (!normalizedPath.startsWith('/admin/')) {
    return null;
  }

  for (const [workspaceKey, segment] of Object.entries(
    ADMIN_WORKSPACE_SEGMENTS,
  ) as Array<[Exclude<AdminWorkspaceKey, 'overview'>, string]>) {
    if (
      normalizedPath === `/admin/${segment}` ||
      normalizedPath.startsWith(`/admin/${segment}/`)
    ) {
      return workspaceKey;
    }
  }

  return null;
}
