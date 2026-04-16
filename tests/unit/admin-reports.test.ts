import { describe, expect, it } from 'vitest';

import { exportAdminReportUseCase, serializeAdminReportCsv } from '@/src/domain/admin-reports/use-cases';

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
      timestamp: new Date('2026-04-16T08:00:00.000Z'),
    },
  ],
  listPageVisitsSince: async () => [],
  listJobsSince: async () => [],
});

describe('admin report exports', () => {
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
});
