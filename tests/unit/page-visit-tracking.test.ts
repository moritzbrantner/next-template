import { describe, expect, it } from 'vitest';

import { normalizeTrackedPageVisit, shouldTrackPageVisit } from '@/src/analytics/page-visits';

describe('page visit tracking', () => {
  it('splits the pathname and query parameters for aggregation', () => {
    expect(normalizeTrackedPageVisit('/en/profile?utm_source=launch&filter=active&token=secret')).toEqual({
      href: '/en/profile?utm_source=launch&filter=active&token=secret',
      pathname: '/en/profile',
      queryParameters: [
        { key: 'utm_source', value: 'launch', position: 0 },
        { key: 'filter', value: '[REDACTED]', position: 1 },
        { key: 'token', value: '[REDACTED]', position: 2 },
      ],
    });
  });

  it('normalizes absolute URLs into relative app hrefs', () => {
    expect(normalizeTrackedPageVisit('https://example.com/en/about?ref=nav#team')).toEqual({
      href: '/en/about?ref=nav#team',
      pathname: '/en/about',
      queryParameters: [{ key: 'ref', value: 'nav', position: 0 }],
    });
  });

  it('rejects empty href values', () => {
    expect(() => normalizeTrackedPageVisit('')).toThrowError('Page visit href is required.');
  });

  it('tracks document navigations, including tokenized urls', () => {
    expect(shouldTrackPageVisit({ href: '/en/about?token=invite-token', cause: 'enter' })).toBe(true);
    expect(shouldTrackPageVisit({ href: '/en/about?token=invite-token', cause: 'stay' })).toBe(true);
  });

  it('skips preloads and non-page urls', () => {
    expect(shouldTrackPageVisit({ href: '/en/about?token=invite-token', cause: 'preload' })).toBe(false);
    expect(shouldTrackPageVisit({ href: '/api/analytics/page-visits', cause: 'enter' })).toBe(false);
    expect(shouldTrackPageVisit({ href: '/_serverFn/abc123', cause: 'enter' })).toBe(false);
  });
});
