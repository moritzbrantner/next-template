import { describe, expect, it } from 'vitest';

import { normalizeTrackedPageVisit } from '@/src/analytics/page-visits';

describe('page visit tracking', () => {
  it('splits the pathname and query parameters for aggregation', () => {
    expect(normalizeTrackedPageVisit('/en/profile?tab=security&filter=active&filter=recent')).toEqual({
      href: '/en/profile?tab=security&filter=active&filter=recent',
      pathname: '/en/profile',
      queryParameters: [
        { key: 'tab', value: 'security', position: 0 },
        { key: 'filter', value: 'active', position: 1 },
        { key: 'filter', value: 'recent', position: 2 },
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
});
