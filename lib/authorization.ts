import { createAccessControl } from 'better-auth/plugins/access';

import type { AppSession } from '@/src/auth';
import { getAuthSession } from '@/src/auth.server';

export type AppRole = 'ADMIN' | 'MANAGER' | 'USER';

type RoleInput = AppRole | AppRole[];

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

function normalizeRoles(roleOrRoles: RoleInput): readonly AppRole[] {
  return Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
}

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

function createAuthError(message: string, status: 401 | 403): Error & { status: 401 | 403 } {
  const error = new Error(message) as Error & { status: 401 | 403 };
  error.name = 'AuthorizationError';
  error.status = status;

  return error;
}

export async function requireAuth(): Promise<AppSession> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    throw createAuthError('Authentication required.', 401);
  }

  return session;
}

export async function requireRole(roleOrRoles: RoleInput): Promise<AppSession> {
  const session = await requireAuth();
  const allowedRoles = normalizeRoles(roleOrRoles);

  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    throw createAuthError('You do not have permission to perform this action.', 403);
  }

  return session;
}

export function forbidUnless(condition: unknown, message = 'Forbidden'): asserts condition {
  if (!condition) {
    throw createAuthError(message, 403);
  }
}
