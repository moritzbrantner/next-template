import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getEnv, resetEnvForTests } from '@/src/config/env';

const originalEnv = { ...process.env };
const appEnvKeys = [
  'ADMIN_REPAIR_MODE_ENABLED',
  'ANALYTICS_ENABLED',
  'AUTH_SECRET',
  'AUTH_URL',
  'CSP_REPORT_URI',
  'DATABASE_URL',
  'EMAIL_FROM',
  'EMAIL_PROVIDER',
  'FACEBOOK_CLIENT_ID',
  'FACEBOOK_CLIENT_SECRET',
  'GITHUB_PAGES_BASE_PATH',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'IMAGE_REMOTE_HOSTS',
  'INTERNAL_CRON_SECRET',
  'LOG_LEVEL',
  'MAILPIT_BASE_URL',
  'NEXTAUTH_URL',
  'NEXT_DEPLOY_TARGET',
  'NODE_ENV',
  'PROFILE_IMAGE_PUBLIC_BASE_URL',
  'PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID',
  'PROFILE_IMAGE_STORAGE_BUCKET',
  'PROFILE_IMAGE_STORAGE_ENDPOINT',
  'PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE',
  'PROFILE_IMAGE_STORAGE_REGION',
  'PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY',
  'RATE_LIMIT_OVERRIDES_JSON',
  'RATE_LIMIT_STORE',
  'REDIS_URL',
  'SITE_URL',
  'SMTP_HOST',
  'SMTP_PASSWORD',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'TENOR_API_KEY',
  'TENOR_CLIENT_KEY',
  'X_CLIENT_ID',
  'X_CLIENT_SECRET',
] as const;

function clearAppEnv() {
  for (const key of appEnvKeys) {
    delete process.env[key];
  }

  resetEnvForTests();
}

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
  resetEnvForTests();
}

describe('env parsing', () => {
  beforeEach(() => {
    clearAppEnv();
  });

  afterEach(() => {
    restoreEnv();
  });

  it('fails fast when DATABASE_URL is missing outside gh-pages builds', () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_DEPLOY_TARGET;
    process.env.AUTH_SECRET = 'test-secret';

    expect(() => getEnv()).toThrowError(/DATABASE_URL is required/);
  });

  it('allows gh-pages builds without a database url', () => {
    delete process.env.DATABASE_URL;
    process.env.NEXT_DEPLOY_TARGET = 'gh-pages';
    process.env.AUTH_SECRET = 'test-secret';

    expect(getEnv().database.url).toBeNull();
  });

  it('allows production gh-pages builds without an auth secret', () => {
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    Object.assign(process.env, {
      NODE_ENV: 'production',
      NEXT_DEPLOY_TARGET: 'gh-pages',
    });

    expect(getEnv().auth.secret).toBe('local-build-secret-local-build-secret');
  });

  it('requires an explicit site url for production server builds', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      EMAIL_PROVIDER: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'mailer',
      SMTP_PASSWORD: 'secret',
      INTERNAL_CRON_SECRET: 'cron-secret',
    });
    delete process.env.SITE_URL;
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;

    expect(() => getEnv()).toThrowError(/SITE_URL or AUTH_URL/);
  });

  it('requires SMTP delivery for production server builds', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      SITE_URL: 'https://app.example.com',
      EMAIL_PROVIDER: 'console',
      INTERNAL_CRON_SECRET: 'cron-secret',
    });

    expect(() => getEnv()).toThrowError(/EMAIL_PROVIDER=smtp/);
  });

  it('requires an internal cron secret for production server builds', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      SITE_URL: 'https://app.example.com',
      EMAIL_PROVIDER: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'mailer',
      SMTP_PASSWORD: 'secret',
    });
    delete process.env.INTERNAL_CRON_SECRET;

    expect(() => getEnv()).toThrowError(/INTERNAL_CRON_SECRET/);
  });

  it('requires SMTP settings when SMTP email delivery is selected', () => {
    Object.assign(process.env, {
      SMTP_HOST: 'inherited.example.com',
      SMTP_PORT: '2525',
      SMTP_USER: 'inherited',
      SMTP_PASSWORD: 'inherited',
    });
    clearAppEnv();
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      EMAIL_PROVIDER: 'smtp',
    });

    expect(() => getEnv()).toThrowError(/SMTP_HOST/);
  });

  it('parses SMTP settings for production email delivery', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      EMAIL_PROVIDER: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'mailer',
      SMTP_PASSWORD: 'secret',
      SMTP_SECURE: 'true',
    });

    expect(getEnv().email).toMatchObject({
      provider: 'smtp',
      smtp: {
        host: 'smtp.example.com',
        port: 465,
        user: 'mailer',
        password: 'secret',
        secure: true,
      },
    });
  });

  it('defaults admin repair mode to disabled', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
    });

    expect(getEnv().admin.repairModeEnabled).toBe(false);
  });

  it('parses admin repair mode when explicitly enabled', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      ADMIN_REPAIR_MODE_ENABLED: 'true',
    });

    expect(getEnv().admin.repairModeEnabled).toBe(true);
  });

  it('defaults rate limiting to the postgres store with no overrides', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
    });

    expect(getEnv().rateLimit).toEqual({
      store: 'postgres',
      redisUrl: undefined,
      overrides: {},
    });
  });

  it('requires REDIS_URL when redis rate limiting is selected', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      RATE_LIMIT_STORE: 'redis',
    });

    expect(() => getEnv()).toThrowError(/REDIS_URL is required/);
  });

  it('parses redis rate limiting configuration and policy overrides', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      RATE_LIMIT_STORE: 'redis',
      REDIS_URL: 'redis://127.0.0.1:6379',
      RATE_LIMIT_OVERRIDES_JSON: JSON.stringify({
        'auth.login': { maxRequests: 2, windowMs: 30_000 },
        'admin.*': { maxRequests: 120, windowMs: 60_000 },
      }),
    });

    expect(getEnv().rateLimit).toEqual({
      store: 'redis',
      redisUrl: 'redis://127.0.0.1:6379',
      overrides: {
        'auth.login': { maxRequests: 2, windowMs: 30_000 },
        'admin.*': { maxRequests: 120, windowMs: 60_000 },
      },
    });
  });

  it('fails fast for invalid rate-limit override JSON', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      RATE_LIMIT_OVERRIDES_JSON: JSON.stringify({
        'auth.login': { maxRequests: 0, windowMs: 30_000 },
      }),
    });

    expect(() => getEnv()).toThrowError(/RATE_LIMIT_OVERRIDES_JSON/);
  });

  it('parses the optional CSP report URI', () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgres://example',
      AUTH_SECRET: 'test-secret',
      CSP_REPORT_URI: 'https://reports.example.com/csp',
    });

    expect(getEnv().security.cspReportUri).toBe(
      'https://reports.example.com/csp',
    );
  });
});
