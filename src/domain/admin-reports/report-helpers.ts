import {
  getAdminWorkspaceKey,
  stripLocalePrefix,
  type AdminReportBreakdown,
  type AdminReportCard,
  type AdminReportSeries,
  type AdminWorkspaceKey,
} from './contracts';
import type { ReportPageVisit } from './report-inputs';

const numberFormatter = new Intl.NumberFormat('en-US');

export const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  indigo: '#6366f1',
  zinc: '#71717a',
} as const;

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits,
  }).format(value);
}

export function formatTimestamp(value: Date | null | undefined) {
  return value ? value.toISOString() : 'N/A';
}

export function getUniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

export function isAdminAction(action: string) {
  return action.startsWith('admin.');
}

export function createUnavailableCard(
  id: string,
  label: string,
  message: string,
): AdminReportCard {
  return {
    id,
    label,
    value: 'Data unavailable',
    detail: message,
    tone: 'warning',
  };
}

export function toIsoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getUtcDayStart(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
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

export function buildDailySeries(
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

export function buildRankedBreakdown(
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

export function normalizeAdminVisits(visits: ReportPageVisit[]) {
  return visits
    .map((visit) => {
      if (!visit.userId) {
        return null;
      }

      const workspaceKey = getAdminWorkspaceKey(visit.pathname);

      if (!workspaceKey) {
        return null;
      }

      return {
        ...visit,
        workspaceKey,
        normalizedPath:
          stripLocalePrefix(visit.pathname).split(/[?#]/)[0] || '/',
      };
    })
    .filter(
      (
        visit,
      ): visit is ReportPageVisit & {
        userId: string;
        workspaceKey: AdminWorkspaceKey;
        normalizedPath: string;
      } => Boolean(visit),
    );
}
