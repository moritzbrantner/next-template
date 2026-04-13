import type { MessageNamespace } from '@/src/i18n/messages';

export const shellNamespaces = [
  'NavigationBar',
  'LanguageSelector',
  'ThemeToggle',
] as const satisfies readonly MessageNamespace[];

export const publicWebsiteNamespaces = [
  ...shellNamespaces,
  'RemocnPage',
  'ReportProblemPage',
] as const satisfies readonly MessageNamespace[];

export const guestWebsiteNamespaces = [
  ...shellNamespaces,
] as const satisfies readonly MessageNamespace[];

export const protectedWebsiteNamespaces = [
  ...shellNamespaces,
  'NotificationsPage',
  'PeoplePage',
  'SettingsPage',
] as const satisfies readonly MessageNamespace[];

export const adminWebsiteNamespaces = [
  ...shellNamespaces,
  'AdminPage',
] as const satisfies readonly MessageNamespace[];
