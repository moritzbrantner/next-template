import { getComposeDatabaseUrl, getComposePostgresPort } from '@/tests/environment';

const DEFAULT_E2E_BASE_URL = 'http://127.0.0.1:3006';
const DEFAULT_AUTH_SECRET = 'e2e-auth-secret-0123456789abcdef';
const DEFAULT_MAILPIT_BASE_URL = 'http://127.0.0.1:8025';
const DEFAULT_INTERNAL_CRON_SECRET = 'e2e-internal-cron-secret';

export function getE2EBaseURL() {
  return process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL;
}

export function createE2EEnvironment(baseURL = getE2EBaseURL()) {
  return {
    ...process.env,
    E2E_BASE_URL: baseURL,
    DATABASE_URL: process.env.DATABASE_URL ?? getComposeDatabaseUrl(),
    AUTH_SECRET: DEFAULT_AUTH_SECRET,
    SITE_URL: baseURL,
    AUTH_URL: baseURL,
    NEXTAUTH_URL: baseURL,
    EMAIL_PROVIDER: 'mailpit',
    MAILPIT_BASE_URL: process.env.MAILPIT_BASE_URL ?? DEFAULT_MAILPIT_BASE_URL,
    INTERNAL_CRON_SECRET: DEFAULT_INTERNAL_CRON_SECRET,
    POSTGRES_PORT: process.env.POSTGRES_PORT ?? getComposePostgresPort(),
  };
}

export function applyE2EEnvironment(baseURL = getE2EBaseURL()) {
  Object.assign(process.env, createE2EEnvironment(baseURL));
}
