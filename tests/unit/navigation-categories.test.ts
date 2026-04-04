import { describe, expect, it } from 'vitest';

import { buildNavigationCategories } from '@/src/navigation/navigation-categories';

describe('navigation categories', () => {
  it('shows only grouped public links for signed-out visitors', () => {
    expect(buildNavigationCategories({ isAuthenticated: false, role: null })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['g', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['g', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['g', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['g', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['g', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['g', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['g', 'u'] },
        ],
      },
    ]);
  });

  it('adds authenticated and admin-only destinations without leaving empty categories', () => {
    expect(buildNavigationCategories({ isAuthenticated: true, role: 'USER' })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['g', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['g', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['g', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['g', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['g', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['g', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['g', 'u'] },
          { href: '/data-entry', key: 'dataEntry', translationKey: 'links.dataEntry', hotkey: ['g', 'd'] },
        ],
      },
    ]);

    expect(buildNavigationCategories({ isAuthenticated: true, role: 'MANAGER' })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['g', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['g', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['g', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['g', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['g', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['g', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['g', 'u'] },
          { href: '/data-entry', key: 'dataEntry', translationKey: 'links.dataEntry', hotkey: ['g', 'd'] },
        ],
      },
      {
        key: 'admin',
        links: [{ href: '/admin', key: 'admin', translationKey: 'links.admin', hotkey: ['g', 'm'] }],
      },
    ]);
  });
});
