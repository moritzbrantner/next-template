import {
  canAccessDataEntryWorkspace,
  isAdmin,
  type AppRole,
} from '@/lib/authorization';
import type { NavigationCategoryKey } from '@/src/navigation/navigation-categories';

export type AppPageKey =
  | 'home'
  | 'about'
  | 'remocn'
  | 'reportProblem'
  | 'forms'
  | 'story'
  | 'communication'
  | 'notifications'
  | 'table'
  | 'uploads'
  | 'dataEntry'
  | 'admin'
  | 'profile'
  | 'settings'
  | 'login'
  | 'register';

type Visibility = 'public' | 'guest' | 'authenticated' | 'workspace' | 'admin';

export type AppHotkey = readonly [modifier: 'alt', key: string];

export type AppPageDefinition = {
  key: AppPageKey;
  href: string;
  translationKey: string;
  visibility: Visibility;
  navigationCategory?: NavigationCategoryKey;
  hotkey: AppHotkey;
};

export const appPageDefinitions: readonly AppPageDefinition[] = [
  {
    key: 'home',
    href: '/',
    translationKey: 'links.home',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 'h'],
  },
  {
    key: 'about',
    href: '/about',
    translationKey: 'links.about',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 'a'],
  },
  {
    key: 'remocn',
    href: '/remocn',
    translationKey: 'links.remocn',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 'v'],
  },
  {
    key: 'reportProblem',
    href: '/report-problem',
    translationKey: 'links.reportProblem',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 'b'],
  },
  {
    key: 'story',
    href: '/examples/story',
    translationKey: 'links.story',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 's'],
  },
  {
    key: 'communication',
    href: '/examples/communication',
    translationKey: 'links.communication',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['alt', 'c'],
  },
  {
    key: 'notifications',
    href: '/notifications',
    translationKey: 'links.notifications',
    visibility: 'authenticated',
    navigationCategory: 'workspace',
    hotkey: ['alt', 'n'],
  },
  {
    key: 'forms',
    href: '/examples/forms',
    translationKey: 'links.forms',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['alt', 'f'],
  },
  {
    key: 'table',
    href: '/table',
    translationKey: 'links.table',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['alt', 't'],
  },
  {
    key: 'uploads',
    href: '/examples/uploads',
    translationKey: 'links.uploads',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['alt', 'u'],
  },
  {
    key: 'dataEntry',
    href: '/data-entry',
    translationKey: 'links.dataEntry',
    visibility: 'workspace',
    navigationCategory: 'workspace',
    hotkey: ['alt', 'd'],
  },
  {
    key: 'admin',
    href: '/admin',
    translationKey: 'links.admin',
    visibility: 'admin',
    navigationCategory: 'admin',
    hotkey: ['alt', 'm'],
  },
  {
    key: 'profile',
    href: '/profile',
    translationKey: 'menu.profile',
    visibility: 'authenticated',
    hotkey: ['alt', 'p'],
  },
  {
    key: 'settings',
    href: '/settings',
    translationKey: 'menu.settings',
    visibility: 'authenticated',
    hotkey: ['alt', 'e'],
  },
  {
    key: 'login',
    href: '/login',
    translationKey: 'auth.login',
    visibility: 'guest',
    hotkey: ['alt', 'l'],
  },
  {
    key: 'register',
    href: '/register',
    translationKey: 'auth.register',
    visibility: 'guest',
    hotkey: ['alt', 'r'],
  },
] as const;

export function formatAppHotkey(hotkey: AppHotkey) {
  return hotkey.map((part) => part.toUpperCase()).join('+');
}

export function canViewAppPage(
  page: AppPageDefinition,
  { isAuthenticated, role }: { isAuthenticated: boolean; role: AppRole | null | undefined },
) {
  if (page.visibility === 'guest') {
    return !isAuthenticated;
  }

  if (page.visibility === 'authenticated') {
    return isAuthenticated;
  }

  if (page.visibility === 'workspace') {
    return isAuthenticated && canAccessDataEntryWorkspace(role);
  }

  if (page.visibility === 'admin') {
    return isAuthenticated && isAdmin(role);
  }

  return true;
}

export function getVisibleAppPages({
  isAuthenticated,
  role,
}: {
  isAuthenticated: boolean;
  role: AppRole | null | undefined;
}) {
  return appPageDefinitions.filter((page) => canViewAppPage(page, { isAuthenticated, role }));
}
