import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as registerTenorShare } from '@/app/api/tenor/register-share/route';
import { GET as searchTenor } from '@/app/api/tenor/search/route';
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
  vi.unstubAllGlobals();
}

function applyBaseEnv() {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/next_template?schema=public';
  process.env.AUTH_SECRET = 'test-secret';
  delete process.env.TENOR_API_KEY;
}

describe('Tenor routes', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('disables search without an API key', async () => {
    applyBaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await searchTenor(new Request('http://localhost/api/tenor/search?q=ship-it'));

    await expect(response.json()).resolves.toEqual({
      configured: false,
      results: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('disables share registration without an API key', async () => {
    applyBaseEnv();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await registerTenorShare(
      new Request('http://localhost/api/tenor/register-share', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: 'gif-1',
          q: 'ship-it',
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      configured: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
