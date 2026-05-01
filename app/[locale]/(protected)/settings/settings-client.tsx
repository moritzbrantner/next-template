'use client';

import { AccountDeleteForm } from '@/components/account-delete-form';
import { AccountEmailForm } from '@/components/account-email-form';
import { ProfileBlockedUsersForm } from '@/components/profile-blocked-users-form';
import { ProfileFollowerVisibilityForm } from '@/components/profile-follower-visibility-form';
import { ConsentSettingsCard } from '@/components/privacy/consent-settings-card';
import { ProfileSearchVisibilityForm } from '@/components/profile-search-visibility-form';
import { AppSettingsPanel } from '@/components/settings/app-settings-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  type AppPermissionKey,
} from '@/lib/authorization';
import type { AppSession } from '@/src/auth';
import type { AccountCapabilities } from '@/src/auth/oauth/types';
import type { ProfileDirectoryEntry } from '@/src/domain/profile/use-cases';
import { useTranslations } from '@/src/i18n';
import type { ConsentState } from '@/src/privacy/contracts';
import type { FollowerVisibilityRole } from '@/src/profile/follower-visibility';

export function SettingsClient({
  locale,
  session,
  accountCapabilities,
  consent,
  currentPermissions,
  initialSearchVisibility,
  initialFollowerVisibility,
  initialBlockedProfiles,
}: {
  locale: string;
  session: AppSession;
  accountCapabilities: AccountCapabilities;
  consent: ConsentState;
  currentPermissions: AppPermissionKey[];
  initialSearchVisibility: boolean;
  initialFollowerVisibility: FollowerVisibilityRole;
  initialBlockedProfiles: ProfileDirectoryEntry[];
}) {
  const t = useTranslations('SettingsPage');
  const role = session.user.role ?? 'USER';
  const permissionSet = new Set(currentPermissions);
  const passwordManagementDisabled = !accountCapabilities.hasPassword;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <Badge variant="secondary">{t(`roles.${role.toLowerCase()}`)}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t('description')}</p>
      </header>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>{t('rbac.title')}</CardTitle>
          <CardDescription>{t('rbac.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <PermissionCard title={t('rbac.permissions.viewReports')} enabled={permissionSet.has('admin.reports.read')} enabledLabel={t('rbac.allowed')} disabledLabel={t('rbac.denied')} />
          <PermissionCard title={t('rbac.permissions.manageUsers')} enabled={permissionSet.has('admin.users.read')} enabledLabel={t('rbac.allowed')} disabledLabel={t('rbac.denied')} />
          <PermissionCard title={t('rbac.permissions.manageRoles')} enabled={permissionSet.has('admin.roles.edit')} enabledLabel={t('rbac.allowed')} disabledLabel={t('rbac.denied')} />
          <PermissionCard title={t('rbac.permissions.adminWorkspace')} enabled={permissionSet.has('admin.access')} enabledLabel={t('rbac.allowed')} disabledLabel={t('rbac.denied')} />
          <PermissionCard title={t('rbac.permissions.systemSettings')} enabled={permissionSet.has('admin.systemSettings.edit')} enabledLabel={t('rbac.allowed')} disabledLabel={t('rbac.denied')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t('tabs.appearance')}</CardTitle>
              <CardDescription>{t('saveState')}</CardDescription>
            </div>
            <Badge variant="outline">{locale.toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AppSettingsPanel />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.title')}</CardTitle>
            <CardDescription>{t('privacy.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSearchVisibilityForm
              initialIsSearchable={initialSearchVisibility}
              labels={{
                title: t('profileDiscovery.toggleTitle'),
                description: t('profileDiscovery.toggleDescription'),
                saving: t('profileDiscovery.saving'),
                successEnabled: t('profileDiscovery.successEnabled'),
                successDisabled: t('profileDiscovery.successDisabled'),
                error: t('profileDiscovery.error'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>{t('followerVisibility.title')}</CardTitle>
            <CardDescription>{t('followerVisibility.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileFollowerVisibilityForm
              initialFollowerVisibility={initialFollowerVisibility}
              labels={{
                saving: t('followerVisibility.saving'),
                success: t('followerVisibility.success'),
                error: t('followerVisibility.error'),
                options: {
                  PUBLIC: {
                    title: t('followerVisibility.options.PUBLIC.title'),
                    description: t('followerVisibility.options.PUBLIC.description'),
                  },
                  MEMBERS: {
                    title: t('followerVisibility.options.MEMBERS.title'),
                    description: t('followerVisibility.options.MEMBERS.description'),
                  },
                  PRIVATE: {
                    title: t('followerVisibility.options.PRIVATE.title'),
                    description: t('followerVisibility.options.PRIVATE.description'),
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>{t('blockedUsers.title')}</CardTitle>
            <CardDescription>{t('blockedUsers.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileBlockedUsersForm
              initialProfiles={initialBlockedProfiles}
              labels={{
                empty: t('blockedUsers.empty'),
                unblock: t('blockedUsers.unblock'),
                unblocking: t('blockedUsers.unblocking'),
                error: t('blockedUsers.error'),
                success: t('blockedUsers.success'),
              }}
            />
          </CardContent>
        </Card>

        <ConsentSettingsCard initialConsent={consent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('account.email.title')}</CardTitle>
            <CardDescription>{t('account.email.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {passwordManagementDisabled ? (
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">{t('account.passwordlessNotice')}</p>
            ) : null}
            <AccountEmailForm
              currentEmail={session.user.email}
              disabled={!accountCapabilities.canManageEmailWithPassword}
              labels={{
                currentEmail: t('account.email.currentEmail'),
                currentEmailMissing: t('account.email.currentEmailMissing'),
                newEmail: t('account.email.newEmail'),
                currentPassword: t('account.email.currentPassword'),
                save: t('account.email.save'),
                saving: t('account.email.saving'),
                success: t('account.email.success'),
                genericError: t('account.email.genericError'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{t('account.deletion.title')}</CardTitle>
              <Badge variant="outline">{t('account.deletion.badge')}</Badge>
            </div>
            <CardDescription>{t('account.deletion.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">{t('account.deletion.warning')}</p>
            {passwordManagementDisabled ? (
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">{t('account.passwordlessNotice')}</p>
            ) : null}
            <AccountDeleteForm
              disabled={!accountCapabilities.canDeleteWithPassword}
              labels={{
                currentPassword: t('account.deletion.currentPassword'),
                remove: t('account.deletion.remove'),
                removing: t('account.deletion.removing'),
                redirecting: t('account.deletion.redirecting'),
                genericError: t('account.deletion.genericError'),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function PermissionCard({
  title,
  enabled,
  enabledLabel,
  disabledLabel,
}: {
  title: string;
  enabled: boolean;
  enabledLabel: string;
  disabledLabel: string;
}) {
  return (
    <div className="rounded-2xl border p-4 dark:border-zinc-800">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{enabled ? enabledLabel : disabledLabel}</p>
    </div>
  );
}
