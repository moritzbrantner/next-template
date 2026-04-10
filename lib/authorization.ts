import { createAccessControl } from 'better-auth/plugins/access';

export type AppRole = 'ADMIN' | 'MANAGER' | 'USER';

type BusinessAction =
  | 'viewDashboard'
  | 'editOwnProfile'
  | 'accessDataEntryWorkspace'
  | 'accessAdminArea'
  | 'viewReports'
  | 'manageUsers'
  | 'manageSystemSettings';

const roleHierarchy: Record<AppRole, number> = {
  USER: 0,
  MANAGER: 1,
  ADMIN: 2,
};

const appAccessControl = createAccessControl({
  dashboard: ['view'],
  profile: ['update'],
  workspace: ['access'],
  admin: ['access'],
  reports: ['view'],
  users: ['manage'],
  system: ['manage'],
});

const appRoles = {
  USER: appAccessControl.newRole({
    dashboard: ['view'],
    profile: ['update'],
    workspace: ['access'],
  }),
  MANAGER: appAccessControl.newRole({
    dashboard: ['view'],
    profile: ['update'],
    workspace: ['access'],
  }),
  ADMIN: appAccessControl.newRole({
    dashboard: ['view'],
    profile: ['update'],
    workspace: ['access'],
    admin: ['access'],
    reports: ['view'],
    users: ['manage'],
    system: ['manage'],
  }),
} as const;

type PermissionRequest = Parameters<(typeof appRoles)['ADMIN']['authorize']>[0];

const actionPermissions: Record<BusinessAction, PermissionRequest> = {
  viewDashboard: {
    dashboard: ['view'],
  },
  editOwnProfile: {
    profile: ['update'],
  },
  accessDataEntryWorkspace: {
    workspace: ['access'],
  },
  accessAdminArea: {
    admin: ['access'],
  },
  viewReports: {
    reports: ['view'],
  },
  manageUsers: {
    users: ['manage'],
  },
  manageSystemSettings: {
    system: ['manage'],
  },
};

export function hasRole(currentRole: AppRole | null | undefined, minimumRole: AppRole): boolean {
  if (!currentRole) {
    return false;
  }

  return roleHierarchy[currentRole] >= roleHierarchy[minimumRole];
}

export function isAdmin(role: AppRole | null | undefined): boolean {
  return hasRole(role, 'ADMIN');
}

function canPerform(role: AppRole | null | undefined, action: BusinessAction): boolean {
  if (!role) {
    return false;
  }

  return (appRoles[role] as (typeof appRoles)['ADMIN']).authorize(actionPermissions[action]).success;
}

export function canViewDashboard(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'viewDashboard');
}

export function canEditOwnProfile(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'editOwnProfile');
}

export function canViewReports(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'viewReports');
}

export function canAccessDataEntryWorkspace(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'accessDataEntryWorkspace');
}

export function canAccessAdminArea(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'accessAdminArea');
}

export function canManageUsers(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'manageUsers');
}

export function canManageSystemSettings(role: AppRole | null | undefined): boolean {
  return canPerform(role, 'manageSystemSettings');
}

export function forbidUnless(condition: unknown, message = 'Forbidden'): asserts condition {
  if (!condition) {
    const error = new Error(message) as Error & { status: 403 };
    error.name = 'AuthorizationError';
    error.status = 403;
    throw error;
  }
}
