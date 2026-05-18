import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/src/api/route-security');
  vi.doUnmock('@/src/domain/support/problem-reports');
});

describe('admin problem report routes', () => {
  it('rejects non-admin list access before reading reports', async () => {
    const listProblemReports = vi.fn();
    vi.doMock('@/src/api/route-security', () => ({
      secureRoute: vi.fn().mockResolvedValue({
        ok: false,
        response: Response.json({ error: 'Forbidden.' }, { status: 403 }),
      }),
    }));
    vi.doMock('@/src/domain/support/problem-reports', async () => {
      const actual = await vi.importActual<
        typeof import('@/src/domain/support/problem-reports')
      >('@/src/domain/support/problem-reports');
      return {
        ...actual,
        listProblemReports,
      };
    });

    const route = await import('@/app/api/admin/problem-reports/route');
    const response = await route.GET(
      new Request('https://app.example.com/api/admin/problem-reports'),
    );

    expect(response.status).toBe(403);
    expect(listProblemReports).not.toHaveBeenCalled();
  });

  it('rejects non-admin detail access before reading reports', async () => {
    const getProblemReportById = vi.fn();
    vi.doMock('@/src/api/route-security', () => ({
      secureRoute: vi.fn().mockResolvedValue({
        ok: false,
        response: Response.json({ error: 'Forbidden.' }, { status: 403 }),
      }),
    }));
    vi.doMock('@/src/domain/support/problem-reports', async () => {
      const actual = await vi.importActual<
        typeof import('@/src/domain/support/problem-reports')
      >('@/src/domain/support/problem-reports');
      return {
        ...actual,
        getProblemReportById,
      };
    });

    const route =
      await import('@/app/api/admin/problem-reports/[reportId]/route');
    const response = await route.GET(
      new Request('https://app.example.com/api/admin/problem-reports/report_1'),
      {
        params: Promise.resolve({ reportId: 'report_1' }),
      },
    );

    expect(response.status).toBe(403);
    expect(getProblemReportById).not.toHaveBeenCalled();
  });
});
