import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  exportAdminReportUseCase,
  getAdminReportSummaryUseCase,
  getAdminWorkspaceKey,
  serializeAdminReportCsv,
  stripLocalePrefix,
} from '@/src/domain/admin-reports/use-cases';

const fakeDeps = Promise.resolve({
  listUsers: async () => [
    { id: 'admin_1', role: 'ADMIN' as const, lockoutUntil: null },
    { id: 'manager_1', role: 'MANAGER' as const, lockoutUntil: null },
  ],
  listAuditLogsSince: async () => [
    {
      id: 'audit_1',
      actorId: 'admin_1',
      action: 'admin.reports.export',
      outcome: 'allowed',
      statusCode: 200,
      metadata: {},
      timestamp: new Date('2026-04-16T08:00:00.000Z'),
    },
  ],
  listPageVisitsSince: async () => [],
  listJobsSince: async () => [],
});

afterEach(() => {
  vi.useRealTimers();
});

describe('admin report exports', () => {
  it('normalizes localized admin paths into workspace keys', () => {
    expect(stripLocalePrefix('/en/admin/reports?window=7d')).toBe('/admin/reports?window=7d');
    expect(getAdminWorkspaceKey('/en/admin/reports')).toBe('reports');
    expect(getAdminWorkspaceKey('/de/admin/users/123')).toBe('users');
    expect(getAdminWorkspaceKey('/en/admin')).toBe('overview');
  });

  it('excludes localized non-admin routes', () => {
    expect(getAdminWorkspaceKey('/en/settings')).toBeNull();
    expect(getAdminWorkspaceKey('/de/profile')).toBeNull();
  });

  it('serializes CSV rows with stable headers', async () => {
    const exported = await exportAdminReportUseCase('auditActivity', '7d', 'csv', fakeDeps);

    expect(exported.filename).toBe('auditActivity-7d.csv');
    expect(exported.body.split('\n')[0]).toBe('Timestamp,Action,Outcome,Status,Actor');
  });

  it('escapes CSV content correctly', () => {
    expect(
      serializeAdminReportCsv({
        columns: ['A', 'B'],
        rows: [['alpha', 'quote "here"']],
        emptyMessage: '',
      }),
    ).toBe('A,B\nalpha,"quote ""here"""');
  });

  it('compares summary metrics against the previous equal-length window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));

    const summary = await getAdminReportSummaryUseCase(
      '7d',
      Promise.resolve({
        listUsers: async () => [{ id: 'admin_1', role: 'ADMIN' as const, lockoutUntil: null }],
        listAuditLogsSince: async () => [],
        listPageVisitsSince: async () => [
          {
            id: 'visit_current_1',
            userId: 'admin_1',
            pathname: '/en/admin/reports',
            href: '/en/admin/reports',
            visitedAt: new Date('2026-04-11T08:00:00.000Z'),
          },
          {
            id: 'visit_current_2',
            userId: 'admin_2',
            pathname: '/de/admin/users/123',
            href: '/de/admin/users/123',
            visitedAt: new Date('2026-04-12T09:00:00.000Z'),
          },
          {
            id: 'visit_previous_1',
            userId: 'admin_3',
            pathname: '/en/admin/reports',
            href: '/en/admin/reports',
            visitedAt: new Date('2026-04-07T09:00:00.000Z'),
          },
        ],
        listJobsSince: async () => [],
      }),
    );

    const adminVisitsMetric = summary.metrics.find((metric) => metric.id === 'adminVisits');

    expect(summary.status).toBe('live');
    expect(adminVisitsMetric?.value).toBe('2');
    expect(adminVisitsMetric?.change?.rawDelta).toBe(1);
    expect(adminVisitsMetric?.change?.detail).toContain('previous 7d');
  });

  it('returns degraded summaries without rendering zero values as truth', async () => {
    const summary = await getAdminReportSummaryUseCase(
      '7d',
      Promise.resolve({
        listUsers: async () => {
          throw new Error('database unavailable');
        },
        listAuditLogsSince: async () => [],
        listPageVisitsSince: async () => [],
        listJobsSince: async () => [],
      }),
    );

    expect(summary.status).toBe('degraded');
    expect(summary.metrics.every((metric) => metric.value === 'Data unavailable')).toBe(true);
  });
});
