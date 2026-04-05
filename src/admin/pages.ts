export const adminPageDefinitions = [
  { key: 'overview', href: '/admin' },
  { key: 'reports', href: '/admin/reports' },
  { key: 'users', href: '/admin/users' },
  { key: 'systemSettings', href: '/admin/system-settings' },
  { key: 'dataStudio', href: '/admin/data-studio' },
] as const;

export type AdminPageKey = (typeof adminPageDefinitions)[number]['key'];

export const adminWorkspacePageDefinitions = adminPageDefinitions.filter((page) => page.key !== 'overview');
