import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppRole } from '@/lib/authorization';
import { exportAdminReportUseCase, getAdminReportDetailUseCase } from '@/src/domain/admin-reports/use-cases';

function createApiMocks(session: { user?: { id: string; role: AppRole } } | null) {
  vi.doMock('@/src/api/security', () => ({
    auditAction: vi.fn().mockResolvedValue(undefined),
    enforceRateLimit: vi.fn().mockResolvedValue({ ok: true, remaining: 10, resetAt: 0 }),
    getRateLimitKey: vi.fn().mockReturnValue('test'),
  }));
  vi.doMock('@/src/auth.server', () => ({
    getAuthSession: vi.fn().mockResolvedValue(session),
  }));
  vi.doMock('@/src/observability/logger', () => ({
    errorReporter: vi.fn(),
    getLogger: vi.fn().mockReturnValue({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }),
  }));
  vi.doMock('@/src/observability/request-context', () => ({
    createRequestContext: vi.fn().mockReturnValue({ requestId: 'test-request' }),
    setRequestActorId: vi.fn(),
    withRequestContext: vi.fn(async (_context, callback: () => Promise<Response>) => callback()),
  }));
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock('@/src/foundation/features/runtime');
  vi.doUnmock('@/src/api/security');
  vi.doUnmock('@/src/auth.server');
  vi.doUnmock('@/src/observability/logger');
  vi.doUnmock('@/src/observability/request-context');
});

describe('admin reports', () => {
  it('aggregates report detail data from operational records', async () => {
    const detail = await getAdminReportDetailUseCase(
      'schemaHealth',
      '7d',
      Promise.resolve({
        listUsers: async () => [],
        listAuditLogsSince: async () => [
          {
            id: 'audit_1',
            actorId: 'admin_1',
            action: 'admin.dataStudio.createRecord',
            outcome: 'denied',
            statusCode: 403,
            metadata: { tableName: 'users' },
            timestamp: new Date('2026-04-16T08:00:00.000Z'),
          },
        ],
        listPageVisitsSince: async () => [],
        listJobsSince: async () => [
          {
            id: 'job_1',
            jobName: 'publishAnnouncement',
            status: 'failed',
            attempts: 2,
            lastError: 'database unavailable',
            runAt: new Date('2026-04-16T07:00:00.000Z'),
            updatedAt: new Date('2026-04-16T07:05:00.000Z'),
          },
        ],
      }),
    );

    expect(detail.cards.find((card) => card.label === 'Failed jobs')?.value).toBe('1');
    expect(detail.table.rows).toContainEqual([
      '2026-04-16T07:05:00.000Z',
      'job',
      'publishAnnouncement',
      'failed',
      'attempts 2',
      'database unavailable',
    ]);
    expect(detail.table.rows).toContainEqual([
      '2026-04-16T08:00:00.000Z',
      'write',
      'users',
      'denied',
      '403',
      'admin_1',
    ]);
  });

  it('exports report data as JSON and CSV', async () => {
    const deps = Promise.resolve({
      listUsers: async () => [{ id: 'admin_1', role: 'ADMIN' as const, lockoutUntil: null }],
      listAuditLogsSince: async () => [],
      listPageVisitsSince: async () => [
        {
          id: 'visit_1',
          userId: 'admin_1',
          pathname: '/en/admin/reports',
          href: 'http://localhost/en/admin/reports',
          visitedAt: new Date('2026-04-16T08:00:00.000Z'),
        },
      ],
      listJobsSince: async () => [],
    });

    const jsonExport = await exportAdminReportUseCase('workspaceAdoption', '7d', 'json', deps);
    const csvExport = await exportAdminReportUseCase('workspaceAdoption', '7d', 'csv', deps);

    expect(jsonExport.contentType).toContain('application/json');
    expect(jsonExport.body).toContain('"series"');
    expect(jsonExport.body).toContain('"breakdowns"');
    expect(csvExport.body.split('\n')[0]).toBe('Path,Workspace,Visits,Unique admins');
  });

  it('aggregates localized workspace visits by normalized workspace key', async () => {
    const detail = await getAdminReportDetailUseCase(
      'workspaceAdoption',
      '7d',
      Promise.resolve({
        listUsers: async () => [],
        listAuditLogsSince: async () => [],
        listPageVisitsSince: async () => [
          {
            id: 'visit_1',
            userId: 'admin_1',
            pathname: '/en/admin/reports',
            href: '/en/admin/reports',
            visitedAt: new Date('2026-04-16T08:00:00.000Z'),
          },
          {
            id: 'visit_2',
            userId: 'admin_1',
            pathname: '/de/admin/users/123',
            href: '/de/admin/users/123',
            visitedAt: new Date('2026-04-16T09:00:00.000Z'),
          },
        ],
        listJobsSince: async () => [],
      }),
    );

    expect(detail.cards.find((card) => card.label === 'Admin visits')?.value).toBe('2');
    expect(detail.breakdowns.find((breakdown) => breakdown.id === 'workspace-visits')?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Reports', value: '1' }),
        expect.objectContaining({ label: 'Users', value: '1' }),
      ]),
    );
    expect(detail.table.rows).toEqual(
      expect.arrayContaining([
        ['/admin/reports', 'Reports', '1', '1'],
        ['/admin/users/123', 'Users', '1', '1'],
      ]),
    );
  });

  it('enforces auth and feature gates for the reports export API', async () => {
    createApiMocks(null);
    vi.doMock('@/src/foundation/features/runtime', () => ({
      isFeatureEnabled: (featureKey: string) => featureKey !== 'admin.reports',
    }));

    const routeDisabled = await import('@/app/api/admin/reports/[reportId]/route');
    const disabledResponse = await routeDisabled.GET(
      new Request('http://localhost/api/admin/reports/securityAccess?window=7d&format=csv'),
      { params: Promise.resolve({ reportId: 'securityAccess' }) },
    );
    expect(disabledResponse.status).toBe(404);

    vi.resetModules();
    createApiMocks(null);
    vi.doMock('@/src/foundation/features/runtime', () => ({
      isFeatureEnabled: () => true,
    }));

    const routeUnauthorized = await import('@/app/api/admin/reports/[reportId]/route');
    const unauthorizedResponse = await routeUnauthorized.GET(
      new Request('http://localhost/api/admin/reports/securityAccess?window=7d&format=csv'),
      { params: Promise.resolve({ reportId: 'securityAccess' }) },
    );

    expect(unauthorizedResponse.status).toBe(401);
  });
});
