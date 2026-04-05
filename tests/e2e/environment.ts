const DEFAULT_E2E_BASE_URL = 'http://127.0.0.1:3006';
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55433/next_template?schema=public';
const DEFAULT_AUTH_SECRET = 'e2e-auth-secret-0123456789abcdef';
const DEFAULT_MAILPIT_BASE_URL = 'http://127.0.0.1:8025';

export function getE2EBaseURL() {
  return process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL;
}

export function createE2EEnvironment(baseURL = getE2EBaseURL()) {
  return {
    ...process.env,
    E2E_BASE_URL: baseURL,
    DATABASE_URL: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ?? DEFAULT_AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL ?? baseURL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? 'mailpit',
    MAILPIT_BASE_URL: process.env.MAILPIT_BASE_URL ?? DEFAULT_MAILPIT_BASE_URL,
    POSTGRES_PORT: process.env.POSTGRES_PORT ?? '55433',
  };
}

export function applyE2EEnvironment(baseURL = getE2EBaseURL()) {
  Object.assign(process.env, createE2EEnvironment(baseURL));
}
