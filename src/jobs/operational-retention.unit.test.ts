import { describe, expect, it, vi } from 'vitest';

vi.mock('@/src/site-config/service', () => ({
  archiveAnnouncementNow: vi.fn(),
  getAdminAnalyticsSettings: vi.fn().mockResolvedValue({
    pageVisitRetentionDays: 365,
    defaultAdminReportWindow: '7d',
  }),
  getAnnouncementById: vi.fn(),
  publishAnnouncementNow: vi.fn(),
}));

import {
  operationalRetentionDefaults,
  resolvePruneOperationalTablesRetentionDays,
} from '@/src/jobs/service';

describe('operational table prune retention', () => {
  it('uses documented defaults when no overrides are provided', () => {
    expect(resolvePruneOperationalTablesRetentionDays({})).toEqual({
      rateLimitCounterRetentionDays:
        operationalRetentionDefaults.rateLimitCounterRetentionDays,
      auditLogRetentionDays: operationalRetentionDefaults.auditLogRetentionDays,
      completedJobRetentionDays:
        operationalRetentionDefaults.completedJobRetentionDays,
      failedJobRetentionDays:
        operationalRetentionDefaults.failedJobRetentionDays,
    });
  });

  it('accepts positive job payload overrides', () => {
    expect(
      resolvePruneOperationalTablesRetentionDays({
        rateLimitCounterOlderThanDays: 1,
        auditLogOlderThanDays: 45,
        completedJobOlderThanDays: 7,
        failedJobOlderThanDays: 14,
      }),
    ).toEqual({
      rateLimitCounterRetentionDays: 1,
      auditLogRetentionDays: 45,
      completedJobRetentionDays: 7,
      failedJobRetentionDays: 14,
    });
  });

  it('falls back to defaults for invalid overrides', () => {
    expect(
      resolvePruneOperationalTablesRetentionDays({
        rateLimitCounterOlderThanDays: 0,
        auditLogOlderThanDays: -1,
        completedJobOlderThanDays: Number.NaN,
        failedJobOlderThanDays: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({
      rateLimitCounterRetentionDays:
        operationalRetentionDefaults.rateLimitCounterRetentionDays,
      auditLogRetentionDays: operationalRetentionDefaults.auditLogRetentionDays,
      completedJobRetentionDays:
        operationalRetentionDefaults.completedJobRetentionDays,
      failedJobRetentionDays:
        operationalRetentionDefaults.failedJobRetentionDays,
    });
  });
});
