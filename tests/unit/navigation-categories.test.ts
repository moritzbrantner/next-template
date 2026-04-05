import { describe, expect, it } from 'vitest';

import { buildNavigationCategories } from '@/src/navigation/navigation-categories';

describe('navigation categories', () => {
  it('shows only grouped public links for signed-out visitors', () => {
    expect(buildNavigationCategories({ isAuthenticated: false, role: null })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['alt', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['alt', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
        ],
      },
    ]);
  });

  it('adds authenticated and admin-only destinations without leaving empty categories', () => {
    expect(buildNavigationCategories({ isAuthenticated: true, role: 'USER' })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['alt', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['alt', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/notifications', key: 'notifications', translationKey: 'links.notifications', hotkey: ['alt', 'n'] },
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
          { href: '/data-entry', key: 'dataEntry', translationKey: 'links.dataEntry', hotkey: ['alt', 'd'] },
        ],
      },
    ]);

    expect(buildNavigationCategories({ isAuthenticated: true, role: 'MANAGER' })).toEqual([
      {
        key: 'discover',
        links: [
          { href: '/', key: 'home', translationKey: 'links.home', hotkey: ['alt', 'h'] },
          { href: '/about', key: 'about', translationKey: 'links.about', hotkey: ['alt', 'a'] },
          { href: '/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/notifications', key: 'notifications', translationKey: 'links.notifications', hotkey: ['alt', 'n'] },
          { href: '/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
          { href: '/data-entry', key: 'dataEntry', translationKey: 'links.dataEntry', hotkey: ['alt', 'd'] },
        ],
      },
    ]);
  });
});
