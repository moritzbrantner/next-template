import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetEnvForTests } from '@/src/config/env';

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
  resetEnvForTests();
  vi.resetModules();
}

describe('next security headers', () => {
  beforeEach(() => {
    restoreEnv();
    Object.assign(process.env, {
      AUTH_SECRET: 'test-secret',
      DATABASE_URL: 'postgres://example',
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  it('builds enforced and report-only CSP headers with optional reporting', async () => {
    const { buildSecurityHeaders } = await import('../../next.config');

    const headers = buildSecurityHeaders({
      imageOrigins: ['https://images.example.com'],
      cspReportUri: 'https://reports.example.com/csp',
    });
    const headerMap = new Map(
      headers.map((header) => [header.key, header.value]),
    );

    expect(headerMap.get('Content-Security-Policy')).toContain(
      "script-src 'self' 'unsafe-inline'",
    );
    expect(headerMap.get('Content-Security-Policy-Report-Only')).toContain(
      "script-src 'self'",
    );
    expect(headerMap.get('Content-Security-Policy-Report-Only')).toContain(
      'report-uri https://reports.example.com/csp',
    );
    expect(headerMap.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(headerMap.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(headerMap.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('enables production headers outside GitHub Pages builds', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      AUTH_SECRET: 'test-secret',
      DATABASE_URL: 'postgres://example',
      SITE_URL: 'https://app.example.com',
      EMAIL_PROVIDER: 'smtp',
      EMAIL_FROM: 'no-reply@example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'mailer',
      SMTP_PASSWORD: 'secret',
      INTERNAL_CRON_SECRET: 'cron-secret',
      CSP_REPORT_URI: 'https://reports.example.com/csp',
    });
    resetEnvForTests();
    vi.resetModules();

    const { normalNextConfig } = await import('../../next.config');
    const headers = await normalNextConfig.headers?.();

    expect(headers?.[0]?.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'Content-Security-Policy-Report-Only',
          value: expect.stringContaining(
            'report-uri https://reports.example.com/csp',
          ),
        }),
        expect.objectContaining({
          key: 'Strict-Transport-Security',
        }),
      ]),
    );
  });
});
