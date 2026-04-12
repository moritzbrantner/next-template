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
          { href: '/blog', key: 'blog', translationKey: 'links.blog', hotkey: ['alt', 'g'] },
          { href: '/changelog', key: 'changelog', translationKey: 'links.changelog', hotkey: ['alt', 'k'] },
          { href: '/remocn', key: 'remocn', translationKey: 'links.remocn', hotkey: ['alt', 'v'] },
          { href: '/report-problem', key: 'reportProblem', translationKey: 'links.reportProblem', hotkey: ['alt', 'b'] },
          { href: '/examples/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/examples/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/examples/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/examples/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
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
          { href: '/blog', key: 'blog', translationKey: 'links.blog', hotkey: ['alt', 'g'] },
          { href: '/changelog', key: 'changelog', translationKey: 'links.changelog', hotkey: ['alt', 'k'] },
          { href: '/remocn', key: 'remocn', translationKey: 'links.remocn', hotkey: ['alt', 'v'] },
          { href: '/report-problem', key: 'reportProblem', translationKey: 'links.reportProblem', hotkey: ['alt', 'b'] },          
          { href: '/examples/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/examples/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
          { href: '/people', key: 'people', translationKey: 'links.people', hotkey: ['alt', 'j'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/notifications', key: 'notifications', translationKey: 'links.notifications', hotkey: ['alt', 'n'] },
          { href: '/examples/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/examples/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
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
          { href: '/blog', key: 'blog', translationKey: 'links.blog', hotkey: ['alt', 'g'] },
          { href: '/changelog', key: 'changelog', translationKey: 'links.changelog', hotkey: ['alt', 'k'] },
          { href: '/remocn', key: 'remocn', translationKey: 'links.remocn', hotkey: ['alt', 'v'] },
          { href: '/report-problem', key: 'reportProblem', translationKey: 'links.reportProblem', hotkey: ['alt', 'b'] },
          { href: '/examples/story', key: 'story', translationKey: 'links.story', hotkey: ['alt', 's'] },
          { href: '/examples/communication', key: 'communication', translationKey: 'links.communication', hotkey: ['alt', 'c'] },
          { href: '/people', key: 'people', translationKey: 'links.people', hotkey: ['alt', 'j'] },
        ],
      },
      {
        key: 'workspace',
        links: [
          { href: '/notifications', key: 'notifications', translationKey: 'links.notifications', hotkey: ['alt', 'n'] },
          { href: '/examples/forms', key: 'forms', translationKey: 'links.forms', hotkey: ['alt', 'f'] },
          { href: '/table', key: 'table', translationKey: 'links.table', hotkey: ['alt', 't'] },
          { href: '/examples/uploads', key: 'uploads', translationKey: 'links.uploads', hotkey: ['alt', 'u'] },
          { href: '/data-entry', key: 'dataEntry', translationKey: 'links.dataEntry', hotkey: ['alt', 'd'] },
        ],
      },
    ]);
  });
});
