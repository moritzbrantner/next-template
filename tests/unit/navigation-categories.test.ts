import { describe, expect, it } from 'vitest';

import { buildNavigationCategories } from '@/src/navigation/navigation-categories';

describe('navigation categories', () => {
  it('shows only grouped public links for signed-out visitors', () => {
    expect(buildNavigationCategories({ isAuthenticated: false, isAdmin: false })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home' },
          { href: '/about', key: 'about' },
          { href: '/story', key: 'story' },
          { href: '/communication', key: 'communication' },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms' },
          { href: '/table', key: 'table' },
          { href: '/uploads', key: 'uploads' },
        ],
      },
    ]);
  });

  it('adds authenticated and admin-only destinations without leaving empty categories', () => {
    expect(buildNavigationCategories({ isAuthenticated: true, isAdmin: false })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home' },
          { href: '/about', key: 'about' },
          { href: '/story', key: 'story' },
          { href: '/communication', key: 'communication' },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms' },
          { href: '/table', key: 'table' },
          { href: '/uploads', key: 'uploads' },
          { href: '/data-entry', key: 'dataEntry', visibility: 'authenticated' },
        ],
      },
    ]);

    expect(buildNavigationCategories({ isAuthenticated: true, isAdmin: true })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home' },
          { href: '/about', key: 'about' },
          { href: '/story', key: 'story' },
          { href: '/communication', key: 'communication' },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms' },
          { href: '/table', key: 'table' },
          { href: '/uploads', key: 'uploads' },
          { href: '/data-entry', key: 'dataEntry', visibility: 'authenticated' },
        ],
      },
      {
        key: 'admin',
        links: [{ href: '/admin', key: 'admin', visibility: 'admin' }],
      },
    ]);
  });
});
