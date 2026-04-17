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
let cachedE2EExampleEnvironment: Record<string, string> | null = null;

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

function loadExampleEnvironment(filename: '.env.example' | '.env.e2e.example') {
  const cache = filename === '.env.example' ? cachedExampleEnvironment : cachedE2EExampleEnvironment;

  if (cache) {
    return cache;
  }

  const examplePath = path.join(APP_ROOT, filename);
  const environment = parseEnvFile(readFileSync(examplePath, 'utf8'));

  if (filename === '.env.example') {
    cachedExampleEnvironment = environment;
  } else {
    cachedE2EExampleEnvironment = environment;
  }

  return environment;
}

function getEnvironmentValue(
  key: string,
  exampleEnvironment: Record<string, string>,
  fallback?: string,
) {
  return process.env[key] ?? exampleEnvironment[key] ?? fallback;
}

function getE2EEnvironmentValue(
  key: string,
  e2eExampleEnvironment: Record<string, string>,
  exampleEnvironment: Record<string, string>,
  fallback?: string,
) {
  return e2eExampleEnvironment[key] ?? process.env[key] ?? exampleEnvironment[key] ?? fallback;
}

export function getE2EBaseURL() {
  return process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL;
}

export function createE2EEnvironment(baseURL = getE2EBaseURL()) {
  const exampleEnvironment = loadExampleEnvironment('.env.example');
  const e2eExampleEnvironment = loadExampleEnvironment('.env.e2e.example');
  const minioApiPort = getE2EEnvironmentValue(
    'MINIO_API_PORT',
    e2eExampleEnvironment,
    exampleEnvironment,
    DEFAULT_MINIO_API_PORT,
  );
  const storageBucket = getEnvironmentValue(
    'MINIO_BUCKET',
    e2eExampleEnvironment,
    getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_BUCKET',
      e2eExampleEnvironment,
      exampleEnvironment,
      DEFAULT_PROFILE_IMAGE_STORAGE_BUCKET,
    ),
  );
  const storageEndpoint = getE2EEnvironmentValue(
    'PROFILE_IMAGE_STORAGE_ENDPOINT',
    e2eExampleEnvironment,
    exampleEnvironment,
    `http://${DEFAULT_MINIO_HOST}:${minioApiPort}`,
  );
  const storagePublicBaseUrl = getE2EEnvironmentValue(
    'PROFILE_IMAGE_PUBLIC_BASE_URL',
    e2eExampleEnvironment,
    exampleEnvironment,
    `${storageEndpoint.replace(/\/$/u, '')}/${storageBucket}`,
  );
  const minioRootUser = getE2EEnvironmentValue(
    'MINIO_ROOT_USER',
    e2eExampleEnvironment,
    exampleEnvironment,
    DEFAULT_MINIO_ROOT_USER,
  );
  const minioRootPassword = getE2EEnvironmentValue(
    'MINIO_ROOT_PASSWORD',
    e2eExampleEnvironment,
    exampleEnvironment,
    DEFAULT_MINIO_ROOT_PASSWORD,
  );

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
    MAILPIT_BASE_URL: getE2EEnvironmentValue(
      'MAILPIT_BASE_URL',
      e2eExampleEnvironment,
      exampleEnvironment,
      DEFAULT_MAILPIT_BASE_URL,
    ),
    INTERNAL_CRON_SECRET: getEnvironmentValue('INTERNAL_CRON_SECRET', exampleEnvironment),
    POSTGRES_PORT: process.env.POSTGRES_PORT ?? getComposePostgresPort(),
    MINIO_API_PORT: minioApiPort,
    MINIO_CONSOLE_PORT: getE2EEnvironmentValue(
      'MINIO_CONSOLE_PORT',
      e2eExampleEnvironment,
      exampleEnvironment,
      DEFAULT_MINIO_CONSOLE_PORT,
    ),
    MINIO_ROOT_USER: minioRootUser,
    MINIO_ROOT_PASSWORD: minioRootPassword,
    MINIO_BUCKET: storageBucket,
    PROFILE_IMAGE_STORAGE_BUCKET: getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_BUCKET',
      e2eExampleEnvironment,
      exampleEnvironment,
      storageBucket,
    ),
    PROFILE_IMAGE_STORAGE_REGION: getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_REGION',
      e2eExampleEnvironment,
      exampleEnvironment,
      DEFAULT_PROFILE_IMAGE_STORAGE_REGION,
    ),
    PROFILE_IMAGE_STORAGE_ENDPOINT: storageEndpoint,
    PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID: getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID',
      e2eExampleEnvironment,
      exampleEnvironment,
      minioRootUser,
    ),
    PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY: getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY',
      e2eExampleEnvironment,
      exampleEnvironment,
      minioRootPassword,
    ),
    PROFILE_IMAGE_PUBLIC_BASE_URL: storagePublicBaseUrl,
    PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE: getE2EEnvironmentValue(
      'PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE',
      e2eExampleEnvironment,
      exampleEnvironment,
      'true',
    ),
  };
}

export function applyE2EEnvironment(baseURL = getE2EBaseURL()) {
  Object.assign(process.env, createE2EEnvironment(baseURL));
}
