import { afterEach, describe, expect, it } from 'vitest';

import { createE2EEnvironment } from '@/tests/e2e/environment';

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function clearE2EEnvironment() {
  for (const key of [
    'AUTH_SECRET',
    'DATABASE_URL',
    'E2E_BASE_URL',
    'EMAIL_PROVIDER',
    'INTERNAL_CRON_SECRET',
    'MAILPIT_BASE_URL',
    'MINIO_API_PORT',
    'MINIO_BUCKET',
    'MINIO_CONSOLE_PORT',
    'MINIO_ROOT_PASSWORD',
    'MINIO_ROOT_USER',
    'NEXTAUTH_URL',
    'POSTGRES_PORT',
    'PROFILE_IMAGE_PUBLIC_BASE_URL',
    'PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID',
    'PROFILE_IMAGE_STORAGE_BUCKET',
    'PROFILE_IMAGE_STORAGE_ENDPOINT',
    'PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE',
    'PROFILE_IMAGE_STORAGE_REGION',
    'PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY',
    'SITE_URL',
    'AUTH_URL',
  ]) {
    delete process.env[key];
  }
}

describe('e2e environment', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('uses .env.example as the baseline for missing e2e values', () => {
    clearE2EEnvironment();

    const environment = createE2EEnvironment();

    expect(environment.AUTH_SECRET).toBe('replace-with-a-long-random-secret');
    expect(environment.INTERNAL_CRON_SECRET).toBe('replace-with-an-internal-cron-secret');
    expect(environment.MAILPIT_BASE_URL).toBe('http://127.0.0.1:8025');
    expect(environment.MINIO_ROOT_USER).toBe('minioadmin');
    expect(environment.PROFILE_IMAGE_STORAGE_REGION).toBe('us-east-1');
  });

  it('keeps e2e-specific overrides on top of .env.example defaults', () => {
    clearE2EEnvironment();

    const environment = createE2EEnvironment();

    expect(environment.E2E_BASE_URL).toBe('http://127.0.0.1:3006');
    expect(environment.SITE_URL).toBe('http://127.0.0.1:3006');
    expect(environment.AUTH_URL).toBe('http://127.0.0.1:3006');
    expect(environment.NEXTAUTH_URL).toBe('http://127.0.0.1:3006');
    expect(environment.EMAIL_PROVIDER).toBe('mailpit');
    expect(environment.DATABASE_URL).toBe('postgresql://postgres:postgres@127.0.0.1:55433/next_template?schema=public');
  });
});
