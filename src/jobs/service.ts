import { and, eq, inArray, isNull, lt, lte, or } from 'drizzle-orm';

import { getDb } from '@/src/db/client';
import {
  jobOutbox,
  notifications,
  pageVisitQueryParameters,
  pageVisits,
  securityAuditLogs,
  securityRateLimitCounters,
} from '@/src/db/schema';
import { sendEmail } from '@/src/email/service';
import {
  jobNames,
  type JobName,
  type JobPayloadMap,
} from '@/src/jobs/contracts';
import { getLogger } from '@/src/observability/logger';
import {
  archiveAnnouncementNow,
  getAdminAnalyticsSettings,
  getAnnouncementById,
  publishAnnouncementNow,
} from '@/src/site-config/service';

const MAX_JOB_ATTEMPTS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export const operationalRetentionDefaults = {
  rateLimitCounterRetentionDays: 7,
  auditLogRetentionDays: 180,
  completedJobRetentionDays: 30,
  failedJobRetentionDays: 90,
} as const;

export class PermanentJobError extends Error {}

function isJobName(value: string): value is JobName {
  return (jobNames as readonly string[]).includes(value);
}

async function runSendEmailJob(payload: JobPayloadMap['sendEmail']) {
  await sendEmail(payload);
}

async function runFanoutNotificationJob(
  payload: JobPayloadMap['fanoutNotification'],
) {
  if (payload.recipientUserIds.length === 0) {
    return;
  }

  const now = new Date();

  await getDb()
    .insert(notifications)
    .values(
      payload.recipientUserIds.map((userId) => ({
        id: crypto.randomUUID(),
        userId,
        actorId: payload.actorId,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? null,
        audience: payload.audience,
        audienceValue: payload.audienceValue ?? null,
        createdAt: now,
      })),
    );
}

export function scheduledTimestampMatches(
  value: Date | null | undefined,
  scheduledFor: string,
) {
  return value?.toISOString() === scheduledFor;
}

async function runPublishAnnouncementJob(
  payload: JobPayloadMap['publishAnnouncement'],
) {
  const announcement = await getAnnouncementById(payload.announcementId);

  if (!announcement) {
    throw new PermanentJobError(
      `Announcement ${payload.announcementId} was not found.`,
    );
  }

  if (
    !scheduledTimestampMatches(announcement.publishAt, payload.scheduledFor)
  ) {
    return;
  }

  await publishAnnouncementNow(payload.announcementId);
}

async function runArchiveAnnouncementJob(
  payload: JobPayloadMap['archiveAnnouncement'],
) {
  const announcement = await getAnnouncementById(payload.announcementId);

  if (!announcement) {
    throw new PermanentJobError(
      `Announcement ${payload.announcementId} was not found.`,
    );
  }

  if (
    !scheduledTimestampMatches(announcement.unpublishAt, payload.scheduledFor)
  ) {
    return;
  }

  await archiveAnnouncementNow(payload.announcementId);
}

export async function resolvePruneAnalyticsOlderThanDays(
  payload: JobPayloadMap['pruneAnalytics'],
) {
  if (typeof payload.olderThanDays === 'number' && payload.olderThanDays > 0) {
    return payload.olderThanDays;
  }

  const analyticsSettings = await getAdminAnalyticsSettings();
  return analyticsSettings.pageVisitRetentionDays;
}

async function runPruneAnalyticsJob(payload: JobPayloadMap['pruneAnalytics']) {
  const olderThanDays = await resolvePruneAnalyticsOlderThanDays(payload);
  const cutoff = new Date(Date.now() - olderThanDays * DAY_MS);
  const visits = await getDb().query.pageVisits.findMany({
    where: (table, { lt }) => lt(table.visitedAt, cutoff),
    columns: { id: true },
  });

  const ids = visits.map((visit) => visit.id);

  if (ids.length === 0) {
    return;
  }

  await getDb().transaction(async (tx) => {
    await tx
      .delete(pageVisitQueryParameters)
      .where(inArray(pageVisitQueryParameters.pageVisitId, ids));
    await tx.delete(pageVisits).where(inArray(pageVisits.id, ids));
  });
}

function resolvePositiveRetentionDays(
  value: number | undefined,
  fallback: number,
) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function resolvePruneOperationalTablesRetentionDays(
  payload: JobPayloadMap['pruneOperationalTables'],
) {
  return {
    rateLimitCounterRetentionDays: resolvePositiveRetentionDays(
      payload.rateLimitCounterOlderThanDays,
      operationalRetentionDefaults.rateLimitCounterRetentionDays,
    ),
    auditLogRetentionDays: resolvePositiveRetentionDays(
      payload.auditLogOlderThanDays,
      operationalRetentionDefaults.auditLogRetentionDays,
    ),
    completedJobRetentionDays: resolvePositiveRetentionDays(
      payload.completedJobOlderThanDays,
      operationalRetentionDefaults.completedJobRetentionDays,
    ),
    failedJobRetentionDays: resolvePositiveRetentionDays(
      payload.failedJobOlderThanDays,
      operationalRetentionDefaults.failedJobRetentionDays,
    ),
  };
}

async function runPruneOperationalTablesJob(
  payload: JobPayloadMap['pruneOperationalTables'],
) {
  const retention = resolvePruneOperationalTablesRetentionDays(payload);
  const now = Date.now();
  const rateLimitCounterCutoff = new Date(
    now - retention.rateLimitCounterRetentionDays * DAY_MS,
  );
  const auditLogCutoff = new Date(
    now - retention.auditLogRetentionDays * DAY_MS,
  );
  const completedJobCutoff = new Date(
    now - retention.completedJobRetentionDays * DAY_MS,
  );
  const failedJobCutoff = new Date(
    now - retention.failedJobRetentionDays * DAY_MS,
  );

  await getDb().transaction(async (tx) => {
    await tx
      .delete(securityRateLimitCounters)
      .where(lt(securityRateLimitCounters.resetAt, rateLimitCounterCutoff));
    await tx
      .delete(securityAuditLogs)
      .where(lt(securityAuditLogs.timestamp, auditLogCutoff));
    await tx
      .delete(jobOutbox)
      .where(
        and(
          eq(jobOutbox.status, 'completed'),
          lt(jobOutbox.updatedAt, completedJobCutoff),
        ),
      );
    await tx
      .delete(jobOutbox)
      .where(
        and(
          eq(jobOutbox.status, 'failed'),
          lt(jobOutbox.updatedAt, failedJobCutoff),
        ),
      );
  });
}

async function runJob(jobName: JobName, payload: JobPayloadMap[JobName]) {
  switch (jobName) {
    case 'sendEmail':
      return runSendEmailJob(payload as JobPayloadMap['sendEmail']);
    case 'fanoutNotification':
      return runFanoutNotificationJob(
        payload as JobPayloadMap['fanoutNotification'],
      );
    case 'publishAnnouncement':
      return runPublishAnnouncementJob(
        payload as JobPayloadMap['publishAnnouncement'],
      );
    case 'archiveAnnouncement':
      return runArchiveAnnouncementJob(
        payload as JobPayloadMap['archiveAnnouncement'],
      );
    case 'pruneAnalytics':
      return runPruneAnalyticsJob(payload as JobPayloadMap['pruneAnalytics']);
    case 'pruneOperationalTables':
      return runPruneOperationalTablesJob(
        payload as JobPayloadMap['pruneOperationalTables'],
      );
    default:
      throw new PermanentJobError(`Unsupported job name: ${String(jobName)}`);
  }
}

export async function enqueueJob<TJobName extends JobName>(
  jobName: TJobName,
  payload: JobPayloadMap[TJobName],
  options?: { runAt?: Date },
) {
  const id = crypto.randomUUID();
  const now = new Date();

  await getDb()
    .insert(jobOutbox)
    .values({
      id,
      jobName,
      payload,
      status: 'pending',
      runAt: options?.runAt ?? now,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });

  return id;
}

async function claimJobs(limit: number) {
  const now = new Date();
  const jobs = await getDb().query.jobOutbox.findMany({
    where: (table, { and: innerAnd, inArray: innerInArray, lte: innerLte }) =>
      innerAnd(
        innerInArray(table.status, ['pending', 'retrying']),
        innerLte(table.runAt, now),
        or(
          isNull(table.lockedAt),
          lte(table.lockedAt, new Date(now.getTime() - 5 * 60 * 1000)),
        ),
      ),
    orderBy: (table, { asc }) => [asc(table.runAt)],
    limit,
  });

  const claimed = [];

  for (const job of jobs) {
    const [updated] = await getDb()
      .update(jobOutbox)
      .set({
        status: 'running',
        lockedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(jobOutbox.id, job.id),
          inArray(jobOutbox.status, ['pending', 'retrying']),
        ),
      )
      .returning();

    if (updated) {
      claimed.push(updated);
    }
  }

  return claimed;
}

export async function runDueJobs(options?: { limit?: number }) {
  const limit = options?.limit ?? 10;
  const claimedJobs = await claimJobs(limit);
  const logger = getLogger({ subsystem: 'jobs' });
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const job of claimedJobs) {
    results.processed += 1;

    try {
      if (!isJobName(job.jobName)) {
        throw new PermanentJobError(`Unsupported job name: ${job.jobName}`);
      }

      await runJob(job.jobName, job.payload as JobPayloadMap[JobName]);

      await getDb()
        .update(jobOutbox)
        .set({
          status: 'completed',
          lockedAt: null,
          lastError: null,
          attempts: job.attempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(jobOutbox.id, job.id));

      results.succeeded += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const permanentFailure =
        error instanceof PermanentJobError || attempts >= MAX_JOB_ATTEMPTS;

      await getDb()
        .update(jobOutbox)
        .set({
          status: permanentFailure ? 'failed' : 'retrying',
          lockedAt: null,
          attempts,
          lastError:
            error instanceof Error ? error.message : 'Unknown job error',
          runAt: permanentFailure
            ? job.runAt
            : new Date(Date.now() + Math.min(attempts, 5) * 60_000),
          updatedAt: new Date(),
        })
        .where(eq(jobOutbox.id, job.id));

      logger.error(
        { err: error, jobId: job.id, jobName: job.jobName },
        'Job execution failed',
      );
      results.failed += 1;
    }
  }

  return results;
}
