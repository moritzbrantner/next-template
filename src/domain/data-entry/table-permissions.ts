import type { AppRole } from '@/lib/authorization';

export type ManagedTable =
  | 'User'
  | 'Profile'
  | 'SecurityAuditLog'
  | 'SecurityRateLimitCounter';

export const managedTables: readonly ManagedTable[] = [
  'User',
  'Profile',
  'SecurityAuditLog',
  'SecurityRateLimitCounter',
] as const;

export type TablePermission = {
  table: ManagedTable;
  label: string;
  readRoles: readonly AppRole[];
  writeRoles: readonly AppRole[];
};

const adminDataEntryRoles = ['ADMIN', 'SUPERADMIN'] as const;

export const tablePermissions: readonly TablePermission[] = [
  {
    table: 'User',
    label: 'User',
    readRoles: adminDataEntryRoles,
    writeRoles: adminDataEntryRoles,
  },
  {
    table: 'Profile',
    label: 'Profile',
    readRoles: adminDataEntryRoles,
    writeRoles: adminDataEntryRoles,
  },
  {
    table: 'SecurityAuditLog',
    label: 'SecurityAuditLog',
    readRoles: adminDataEntryRoles,
    writeRoles: adminDataEntryRoles,
  },
  {
    table: 'SecurityRateLimitCounter',
    label: 'SecurityRateLimitCounter',
    readRoles: adminDataEntryRoles,
    writeRoles: adminDataEntryRoles,
  },
] as const;

export function canReadTable(
  role: AppRole | null | undefined,
  table: ManagedTable,
): boolean {
  if (!role) {
    return false;
  }

  const permission = tablePermissions.find((item) => item.table === table);

  return permission ? permission.readRoles.includes(role) : false;
}

export function canWriteTable(
  role: AppRole | null | undefined,
  table: ManagedTable,
): boolean {
  if (!role) {
    return false;
  }

  const permission = tablePermissions.find((item) => item.table === table);

  return permission ? permission.writeRoles.includes(role) : false;
}
