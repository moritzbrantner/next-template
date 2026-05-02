import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock('@/src/auth/oauth/service');
});

describe('oauth routes', () => {
  it('returns 404 for unsupported providers', async () => {
    const startRoute =
      await import('@/app/api/auth/oauth/[provider]/start/route');
    const callbackRoute =
      await import('@/app/api/auth/oauth/[provider]/callback/route');

    const startResponse = await startRoute.GET(
      new Request('http://localhost/api/auth/oauth/unknown/start'),
      {
        params: Promise.resolve({ provider: 'unknown' }),
      },
    );
    const callbackResponse = await callbackRoute.GET(
      new Request('http://localhost/api/auth/oauth/unknown/callback'),
      {
        params: Promise.resolve({ provider: 'unknown' }),
      },
    );

    expect(startResponse.status).toBe(404);
    expect(callbackResponse.status).toBe(404);
  });

  it('delegates valid providers to the oauth service', async () => {
    const beginOAuthFlow = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302 }));
    const completeOAuthFlow = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302 }));

    vi.doMock('@/src/auth/oauth/service', () => ({
      beginOAuthFlow,
      completeOAuthFlow,
      resolveOAuthFlowContext: vi.fn().mockReturnValue({
        locale: 'en',
        returnTo: '/login',
      }),
    }));

    const startRoute =
      await import('@/app/api/auth/oauth/[provider]/start/route');
    const callbackRoute =
      await import('@/app/api/auth/oauth/[provider]/callback/route');

    await startRoute.GET(
      new Request(
        'http://localhost/api/auth/oauth/google/start?locale=en&returnTo=/login',
      ),
      {
        params: Promise.resolve({ provider: 'google' }),
      },
    );
    await callbackRoute.GET(
      new Request(
        'http://localhost/api/auth/oauth/google/callback?state=abc&code=123',
      ),
      {
        params: Promise.resolve({ provider: 'google' }),
      },
    );

    expect(beginOAuthFlow).toHaveBeenCalledWith('google', {
      locale: 'en',
      returnTo: '/login',
    });
    expect(completeOAuthFlow).toHaveBeenCalledWith(
      'google',
      expect.any(Request),
    );
  });
});
