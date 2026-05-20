import { afterEach, describe, expect, it } from 'vitest';

import { getEnv, resetEnvForTests } from '@/src/config/env';

const originalEnv = { ...process.env };

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

  it('requires SMTP settings when SMTP email delivery is selected', () => {
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
});
