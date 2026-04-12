import { eq, inArray } from 'drizzle-orm';

import { getEnv } from '@/src/config/env';
import { getDb } from '@/src/db/client';
import { featureFlags, siteAnnouncements, siteSettings } from '@/src/db/schema';
import { getLogger } from '@/src/observability/logger';
import type { AppLocale } from '@/i18n/routing';
import type { FeatureFlagKey, PublicSiteConfig, SiteSettingKey } from '@/src/site-config/contracts';
import { featureFlagKeys, siteSettingKeys } from '@/src/site-config/contracts';

type SiteAnnouncementRecord = {
  id: string;
  locale: string;
  title: string;
  body: string;
  href: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishAt: string | null;
  unpublishAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SiteSettingsRows = Awaited<ReturnType<ReturnType<typeof getDb>['query']['siteSettings']['findMany']>>;
type FeatureFlagRows = Awaited<ReturnType<ReturnType<typeof getDb>['query']['featureFlags']['findMany']>>;
type SiteAnnouncementRows = Awaited<ReturnType<ReturnType<typeof getDb>['query']['siteAnnouncements']['findMany']>>;

const CACHE_TTL_MS = 60_000;

const siteConfigDefaults: Record<SiteSettingKey, string> = {
  'site.name': 'Next Template',
  'site.url': getEnv().site.url,
  'seo.defaultTitle': 'Next Template',
  'seo.titleSuffix': ' | Next Template',
  'seo.defaultDescription': 'Next.js application with auth, admin examples, and Drizzle/Postgres persistence.',
  'seo.defaultOgImage': '',
  'contact.supportEmail': 'support@example.com',
};

const featureFlagDefaults: Record<FeatureFlagKey, boolean> = {
  'marketing.blog': true,
  'marketing.changelog': true,
  'marketing.announcements': true,
  'analytics.pageVisits': true,
};

let siteConfigCache:
  | {
      expiresAt: number;
      value: PublicSiteConfig;
    }
  | undefined;
let databaseReadFallbackExpiresAt = 0;
let databaseReadFallbackLoggedAt = 0;

function normalizeBoolean(value: number) {
  return value === 1;
}

function invalidateSiteConfigCache() {
  siteConfigCache = undefined;
}

function hasActiveDatabaseReadFallback() {
  return databaseReadFallbackExpiresAt > Date.now();
}

function getDefaultPublicSiteConfig(): PublicSiteConfig {
  return {
    siteName: siteConfigDefaults['site.name'],
    siteUrl: siteConfigDefaults['site.url'],
    seo: {
      defaultTitle: siteConfigDefaults['seo.defaultTitle'],
      titleSuffix: siteConfigDefaults['seo.titleSuffix'],
      defaultDescription: siteConfigDefaults['seo.defaultDescription'],
      defaultOgImage: siteConfigDefaults['seo.defaultOgImage'] || null,
    },
    contact: {
      supportEmail: siteConfigDefaults['contact.supportEmail'],
    },
    flags: Object.fromEntries(
      featureFlagKeys.map((key) => [key, featureFlagDefaults[key]]),
    ) as Record<FeatureFlagKey, boolean>,
  };
}

function isDatabaseUnavailableError(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current = error;

  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);

    const code = 'code' in current && typeof current.code === 'string' ? current.code : undefined;
    const message = 'message' in current && typeof current.message === 'string' ? current.message : undefined;

    if (code && ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(code)) {
      return true;
    }

    if (message === 'DATABASE_URL is not set') {
      return true;
    }

    current = 'cause' in current ? current.cause : undefined;
  }

  return false;
}

function logReadFallback(error: unknown, operation: string) {
  getLogger({ subsystem: 'site-config', operation }).warn(
    { err: error },
    'Using default site configuration data because the database is unavailable',
  );
}

function activateDatabaseReadFallback(error: unknown, operation: string) {
  const now = Date.now();

  databaseReadFallbackExpiresAt = now + CACHE_TTL_MS;

  if (now - databaseReadFallbackLoggedAt >= CACHE_TTL_MS) {
    databaseReadFallbackLoggedAt = now;
    logReadFallback(error, operation);
  }
}

export async function listSiteSettings() {
  let rows: SiteSettingsRows;

  if (hasActiveDatabaseReadFallback()) {
    rows = [];
  } else {
    try {
      rows = await getDb().query.siteSettings.findMany({
        orderBy: (table, { asc }) => [asc(table.key)],
      });
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      activateDatabaseReadFallback(error, 'listSiteSettings');
      rows = [];
    }
  }

  return siteSettingKeys.map((key) => ({
    key,
    value: rows.find((row) => row.key === key)?.value ?? siteConfigDefaults[key],
  }));
}

export async function upsertSiteSetting(key: SiteSettingKey, value: string) {
  await getDb()
    .insert(siteSettings)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });

  invalidateSiteConfigCache();
}

export async function listFeatureFlags() {
  let rows: FeatureFlagRows;

  if (hasActiveDatabaseReadFallback()) {
    rows = [];
  } else {
    try {
      rows = await getDb().query.featureFlags.findMany({
        orderBy: (table, { asc }) => [asc(table.key)],
      });
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      activateDatabaseReadFallback(error, 'listFeatureFlags');
      rows = [];
    }
  }

  return featureFlagKeys.map((key) => ({
    key,
    enabled: rows.find((row) => row.key === key)?.enabled === 1 ? true : featureFlagDefaults[key],
    description: rows.find((row) => row.key === key)?.description ?? null,
  }));
}

export async function upsertFeatureFlag(key: FeatureFlagKey, enabled: boolean, description?: string) {
  await getDb()
    .insert(featureFlags)
    .values({
      key,
      enabled: enabled ? 1 : 0,
      description: description?.trim() || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: featureFlags.key,
      set: {
        enabled: enabled ? 1 : 0,
        description: description?.trim() || null,
        updatedAt: new Date(),
      },
    });

  invalidateSiteConfigCache();
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  if (siteConfigCache && siteConfigCache.expiresAt > Date.now()) {
    return siteConfigCache.value;
  }

  let value = getDefaultPublicSiteConfig();

  if (!hasActiveDatabaseReadFallback()) {
    try {
      const [settingRows, flagRows] = await Promise.all([
        getDb()
          .select()
          .from(siteSettings)
          .where(inArray(siteSettings.key, [...siteSettingKeys])),
        getDb()
          .select()
          .from(featureFlags)
          .where(inArray(featureFlags.key, [...featureFlagKeys])),
      ]);

      const settings = Object.fromEntries(
        siteSettingKeys.map((key) => [key, settingRows.find((row) => row.key === key)?.value ?? siteConfigDefaults[key]]),
      ) as Record<SiteSettingKey, string>;

      const flags = Object.fromEntries(
        featureFlagKeys.map((key) => [key, normalizeBoolean(flagRows.find((row) => row.key === key)?.enabled ?? (featureFlagDefaults[key] ? 1 : 0))]),
      ) as Record<FeatureFlagKey, boolean>;

      value = {
        siteName: settings['site.name'],
        siteUrl: settings['site.url'],
        seo: {
          defaultTitle: settings['seo.defaultTitle'],
          titleSuffix: settings['seo.titleSuffix'],
          defaultDescription: settings['seo.defaultDescription'],
          defaultOgImage: settings['seo.defaultOgImage'] || null,
        },
        contact: {
          supportEmail: settings['contact.supportEmail'],
        },
        flags,
      };
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      activateDatabaseReadFallback(error, 'getPublicSiteConfig');
    }
  }

  siteConfigCache = {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return value;
}

export async function listAnnouncements(locale?: AppLocale): Promise<SiteAnnouncementRecord[]> {
  let rows: SiteAnnouncementRows;

  if (hasActiveDatabaseReadFallback()) {
    rows = [];
  } else {
    try {
      rows = await getDb().query.siteAnnouncements.findMany({
        where: locale
          ? (table, { eq: equals }) => equals(table.locale, locale)
          : undefined,
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      });
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      activateDatabaseReadFallback(error, 'listAnnouncements');
      rows = [];
    }
  }

  return rows.map((row) => ({
    id: row.id,
    locale: row.locale,
    title: row.title,
    body: row.body,
    href: row.href,
    status: row.status,
    publishAt: row.publishAt?.toISOString() ?? null,
    unpublishAt: row.unpublishAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getActiveAnnouncements(locale: AppLocale) {
  const now = new Date();

  let rows: SiteAnnouncementRows;

  if (hasActiveDatabaseReadFallback()) {
    rows = [];
  } else {
    try {
      rows = await getDb().query.siteAnnouncements.findMany({
        where: (table, { and, eq: equals, gt, isNull, lte, or }) =>
          and(
            equals(table.locale, locale),
            equals(table.status, 'published'),
            or(isNull(table.publishAt), lte(table.publishAt, now)),
            or(isNull(table.unpublishAt), gt(table.unpublishAt, now)),
          ),
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
      });
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }

      activateDatabaseReadFallback(error, 'getActiveAnnouncements');
      rows = [];
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    href: row.href,
  }));
}

export async function getAnnouncementById(id: string) {
  if (hasActiveDatabaseReadFallback()) {
    return null;
  }

  let row;

  try {
    row = await getDb().query.siteAnnouncements.findFirst({
      where: (table, { eq: equals }) => equals(table.id, id),
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }

    activateDatabaseReadFallback(error, 'getAnnouncementById');
    return null;
  }

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    locale: row.locale,
    title: row.title,
    body: row.body,
    href: row.href,
    status: row.status,
    publishAt: row.publishAt,
    unpublishAt: row.unpublishAt,
  };
}

export async function saveAnnouncement(input: {
  id?: string;
  locale: AppLocale;
  title: string;
  body: string;
  href?: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishAt?: Date | null;
  unpublishAt?: Date | null;
}) {
  const id = input.id ?? crypto.randomUUID();
  const now = new Date();

  await getDb()
    .insert(siteAnnouncements)
    .values({
      id,
      locale: input.locale,
      title: input.title.trim(),
      body: input.body.trim(),
      href: input.href?.trim() || null,
      status: input.status,
      publishAt: input.publishAt ?? null,
      unpublishAt: input.unpublishAt ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: siteAnnouncements.id,
      set: {
        locale: input.locale,
        title: input.title.trim(),
        body: input.body.trim(),
        href: input.href?.trim() || null,
        status: input.status,
        publishAt: input.publishAt ?? null,
        unpublishAt: input.unpublishAt ?? null,
        updatedAt: now,
      },
    });

  return id;
}

export async function deleteAnnouncement(id: string) {
  await getDb().delete(siteAnnouncements).where(eq(siteAnnouncements.id, id));
}
