import {
  canAccessAdminArea,
  canAccessDataEntryWorkspace,
  isAdmin,
  type AppRole,
} from '@/lib/authorization';
import type { NavigationCategoryKey } from '@/src/navigation/navigation-categories';

export type AppPageKey =
  | 'home'
  | 'about'
  | 'forms'
  | 'story'
  | 'communication'
  | 'table'
  | 'uploads'
  | 'dataEntry'
  | 'admin'
  | 'profile'
  | 'settings'
  | 'login'
  | 'register';

type Visibility = 'public' | 'guest' | 'authenticated' | 'workspace' | 'manager' | 'admin';

export type AppPageDefinition = {
  key: AppPageKey;
  href: string;
  translationKey: string;
  visibility: Visibility;
  navigationCategory?: NavigationCategoryKey;
  hotkey: readonly [string, string];
};

export const appPageDefinitions: readonly AppPageDefinition[] = [
  {
    key: 'home',
    href: '/',
    translationKey: 'links.home',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['g', 'h'],
  },
  {
    key: 'about',
    href: '/about',
    translationKey: 'links.about',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['g', 'a'],
  },
  {
    key: 'story',
    href: '/story',
    translationKey: 'links.story',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['g', 's'],
  },
  {
    key: 'communication',
    href: '/communication',
    translationKey: 'links.communication',
    visibility: 'public',
    navigationCategory: 'discover',
    hotkey: ['g', 'c'],
  },
  {
    key: 'forms',
    href: '/forms',
    translationKey: 'links.forms',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['g', 'f'],
  },
  {
    key: 'table',
    href: '/table',
    translationKey: 'links.table',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['g', 't'],
  },
  {
    key: 'uploads',
    href: '/uploads',
    translationKey: 'links.uploads',
    visibility: 'public',
    navigationCategory: 'workspace',
    hotkey: ['g', 'u'],
  },
  {
    key: 'dataEntry',
    href: '/data-entry',
    translationKey: 'links.dataEntry',
    visibility: 'workspace',
    navigationCategory: 'workspace',
    hotkey: ['g', 'd'],
  },
  {
    key: 'admin',
    href: '/admin',
    translationKey: 'links.admin',
    visibility: 'manager',
    navigationCategory: 'admin',
    hotkey: ['g', 'm'],
  },
  {
    key: 'profile',
    href: '/profile',
    translationKey: 'menu.profile',
    visibility: 'authenticated',
    hotkey: ['g', 'p'],
  },
  {
    key: 'settings',
    href: '/settings',
    translationKey: 'menu.settings',
    visibility: 'authenticated',
    hotkey: ['g', 'e'],
  },
  {
    key: 'login',
    href: '/login',
    translationKey: 'auth.login',
    visibility: 'guest',
    hotkey: ['g', 'l'],
  },
  {
    key: 'register',
    href: '/register',
    translationKey: 'auth.register',
    visibility: 'guest',
    hotkey: ['g', 'r'],
  },
] as const;

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

  if (page.visibility === 'manager') {
    return isAuthenticated && canAccessAdminArea(role);
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
