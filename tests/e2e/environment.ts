import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getComposeDatabaseUrl, getComposePostgresPort } from '@/tests/environment';

const DEFAULT_E2E_BASE_URL = 'http://127.0.0.1:3006';
const DEFAULT_MAILPIT_BASE_URL = 'http://127.0.0.1:8025';
const DEFAULT_MINIO_HOST = '127.0.0.1';
const DEFAULT_MINIO_API_PORT = '9000';
const DEFAULT_MINIO_CONSOLE_PORT = '9001';
const DEFAULT_MINIO_ROOT_USER = 'minioadmin';
const DEFAULT_MINIO_ROOT_PASSWORD = 'minioadmin';
const DEFAULT_PROFILE_IMAGE_STORAGE_BUCKET = 'profile-images';
const DEFAULT_PROFILE_IMAGE_STORAGE_REGION = 'us-east-1';
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let cachedExampleEnvironment: Record<string, string> | null = null;

function parseEnvFile(contents: string) {
  const environment: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const match = trimmedLine.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, '');
    }

    environment[key] = value;
  }

  return environment;
}

function loadExampleEnvironment() {
  if (cachedExampleEnvironment) {
    return cachedExampleEnvironment;
  }

  const examplePath = path.join(APP_ROOT, '.env.example');
  cachedExampleEnvironment = parseEnvFile(readFileSync(examplePath, 'utf8'));
  return cachedExampleEnvironment;
}

function getEnvironmentValue(
  key: string,
  exampleEnvironment: Record<string, string>,
  fallback?: string,
) {
  return process.env[key] ?? exampleEnvironment[key] ?? fallback;
}

export function getE2EBaseURL() {
  return process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL;
}

export function createE2EEnvironment(baseURL = getE2EBaseURL()) {
  const exampleEnvironment = loadExampleEnvironment();
  const minioApiPort = getEnvironmentValue('MINIO_API_PORT', exampleEnvironment, DEFAULT_MINIO_API_PORT);
  const storageBucket = getEnvironmentValue(
    'MINIO_BUCKET',
    exampleEnvironment,
    getEnvironmentValue('PROFILE_IMAGE_STORAGE_BUCKET', exampleEnvironment, DEFAULT_PROFILE_IMAGE_STORAGE_BUCKET),
  );
  const storageEndpoint = getEnvironmentValue(
    'PROFILE_IMAGE_STORAGE_ENDPOINT',
    exampleEnvironment,
    `http://${DEFAULT_MINIO_HOST}:${minioApiPort}`,
  );
  const storagePublicBaseUrl = getEnvironmentValue(
    'PROFILE_IMAGE_PUBLIC_BASE_URL',
    exampleEnvironment,
    `${storageEndpoint.replace(/\/$/u, '')}/${storageBucket}`,
  );
  const minioRootUser = getEnvironmentValue('MINIO_ROOT_USER', exampleEnvironment, DEFAULT_MINIO_ROOT_USER);
  const minioRootPassword = getEnvironmentValue('MINIO_ROOT_PASSWORD', exampleEnvironment, DEFAULT_MINIO_ROOT_PASSWORD);

  return {
    ...exampleEnvironment,
    ...process.env,
    E2E_BASE_URL: baseURL,
    DATABASE_URL: process.env.DATABASE_URL ?? getComposeDatabaseUrl(),
    AUTH_SECRET: getEnvironmentValue('AUTH_SECRET', exampleEnvironment),
    SITE_URL: baseURL,
    AUTH_URL: baseURL,
    NEXTAUTH_URL: baseURL,
    EMAIL_PROVIDER: 'mailpit',
    MAILPIT_BASE_URL: getEnvironmentValue('MAILPIT_BASE_URL', exampleEnvironment, DEFAULT_MAILPIT_BASE_URL),
    INTERNAL_CRON_SECRET: getEnvironmentValue('INTERNAL_CRON_SECRET', exampleEnvironment),
    POSTGRES_PORT: process.env.POSTGRES_PORT ?? getComposePostgresPort(),
    MINIO_API_PORT: minioApiPort,
    MINIO_CONSOLE_PORT: getEnvironmentValue('MINIO_CONSOLE_PORT', exampleEnvironment, DEFAULT_MINIO_CONSOLE_PORT),
    MINIO_ROOT_USER: minioRootUser,
    MINIO_ROOT_PASSWORD: minioRootPassword,
    MINIO_BUCKET: storageBucket,
    PROFILE_IMAGE_STORAGE_BUCKET: getEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_BUCKET',
      exampleEnvironment,
      storageBucket,
    ),
    PROFILE_IMAGE_STORAGE_REGION: getEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_REGION',
      exampleEnvironment,
      DEFAULT_PROFILE_IMAGE_STORAGE_REGION,
    ),
    PROFILE_IMAGE_STORAGE_ENDPOINT: storageEndpoint,
    PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID: getEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID',
      exampleEnvironment,
      minioRootUser,
    ),
    PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY: getEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY',
      exampleEnvironment,
      minioRootPassword,
    ),
    PROFILE_IMAGE_PUBLIC_BASE_URL: storagePublicBaseUrl,
    PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE: getEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE',
      exampleEnvironment,
      'true',
    ),
  };
}

export function applyE2EEnvironment(baseURL = getE2EBaseURL()) {
  Object.assign(process.env, createE2EEnvironment(baseURL));
}
