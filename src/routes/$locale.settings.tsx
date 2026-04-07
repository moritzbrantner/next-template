import { useState } from 'react';

import { createFileRoute, redirect } from '@tanstack/react-router';
import { DayPicker } from 'react-day-picker';

import { AccountDeleteForm } from '@/components/account-delete-form';
import { AccountEmailForm } from '@/components/account-email-form';
import { ProfileImageForm } from '@/components/profile-image-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  canAccessAdminArea,
  canManageSystemSettings,
  canManageUsers,
  canViewReports,
} from '@/lib/authorization';
import { useTranslations } from '@/src/i18n';
import { backgroundOptions, formatDatePreview, type BackgroundOption } from '@/src/settings/preferences';
import { useAppSettings } from '@/src/settings/provider';

const backgroundSwatches: Record<BackgroundOption, string> = {
  paper: 'from-amber-100 via-white to-zinc-200',
  aurora: 'from-sky-200 via-cyan-100 to-emerald-200',
  dusk: 'from-rose-200 via-orange-100 to-indigo-200',
  forest: 'from-emerald-200 via-lime-100 to-stone-200',
};

const tabs = ['appearance', 'dates', 'workflow', 'notifications', 'account'] as const;

type SettingsTab = (typeof tabs)[number];

export const Route = createFileRoute('/$locale/settings')({
  beforeLoad: ({ context, params }) => {
    if (!context.session?.user?.id) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const { session } = Route.useRouteContext();
  const { locale } = Route.useParams();
  const { settings, updateSettings } = useAppSettings();
  const [previewDate, setPreviewDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  const role = session?.user.role ?? 'USER';
  const formattedPreviewDate = formatDatePreview(previewDate ?? new Date(), settings, locale);
  const updateNotificationSettings = (nextSettings: Partial<(typeof settings.notifications)>) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        ...nextSettings,
      },
    });
  };

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
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PermissionCard
            title={t('rbac.permissions.viewReports')}
            enabled={canViewReports(role)}
            enabledLabel={t('rbac.allowed')}
            disabledLabel={t('rbac.denied')}
          />
          <PermissionCard
            title={t('rbac.permissions.manageUsers')}
            enabled={canManageUsers(role)}
            enabledLabel={t('rbac.allowed')}
            disabledLabel={t('rbac.denied')}
          />
          <PermissionCard
            title={t('rbac.permissions.adminWorkspace')}
            enabled={canAccessAdminArea(role)}
            enabledLabel={t('rbac.allowed')}
            disabledLabel={t('rbac.denied')}
          />
          <PermissionCard
            title={t('rbac.permissions.systemSettings')}
            enabled={canManageSystemSettings(role)}
            enabledLabel={t('rbac.allowed')}
            disabledLabel={t('rbac.denied')}
          />
        </CardContent>
      </Card>

      <div
        role="tablist"
        aria-label={t('title')}
        className="flex flex-wrap gap-2 rounded-3xl border border-zinc-200 bg-white/70 p-2 dark:border-zinc-800 dark:bg-zinc-950/60"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900',
            ].join(' ')}
            onClick={() => setActiveTab(tab)}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'appearance' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('appearance.title')}</CardTitle>
            <CardDescription>{t('appearance.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {backgroundOptions.map((backgroundOption) => {
                const isSelected = settings.background === backgroundOption;

                return (
                  <button
                    key={backgroundOption}
                    type="button"
                    aria-pressed={isSelected}
                    className={[
                      'rounded-2xl border p-3 text-left transition-colors',
                      isSelected
                        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                        : 'border-zinc-200 bg-white/70 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-600',
                    ].join(' ')}
                    onClick={() => updateSettings({ background: backgroundOption })}
                  >
                    <div className={`mb-3 h-20 rounded-xl bg-gradient-to-br ${backgroundSwatches[backgroundOption]}`} />
                    <p className="font-medium">{t(`appearance.backgrounds.${backgroundOption}.title`)}</p>
                    <p className="mt-1 text-sm opacity-80">{t(`appearance.backgrounds.${backgroundOption}.description`)}</p>
                  </button>
                );
              })}
            </div>

            <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />

            <div className="grid gap-4 md:grid-cols-2">
              <ToggleRow
                title={t('appearance.compactSpacing')}
                description={t('appearance.compactSpacingDescription')}
                checked={settings.compactSpacing}
                onCheckedChange={(checked) => updateSettings({ compactSpacing: checked })}
              />
              <ToggleRow
                title={t('appearance.reducedMotion')}
                description={t('appearance.reducedMotionDescription')}
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'dates' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('dates.title')}</CardTitle>
            <CardDescription>{t('dates.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date-format">{t('dates.formatLabel')}</Label>
                <select
                  id="date-format"
                  value={settings.dateFormat}
                  className={selectClassName}
                  onChange={(event) =>
                    updateSettings({
                      dateFormat: event.target.value as 'localized' | 'long' | 'iso',
                    })
                  }
                >
                  <option value="localized">{t('dates.formats.localized')}</option>
                  <option value="long">{t('dates.formats.long')}</option>
                  <option value="iso">{t('dates.formats.iso')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="week-starts-on">{t('dates.weekStartsLabel')}</Label>
                <select
                  id="week-starts-on"
                  value={String(settings.weekStartsOn)}
                  className={selectClassName}
                  onChange={(event) =>
                    updateSettings({
                      weekStartsOn: event.target.value === '0' ? 0 : 1,
                    })
                  }
                >
                  <option value="1">{t('dates.weekStarts.monday')}</option>
                  <option value="0">{t('dates.weekStarts.sunday')}</option>
                </select>
              </div>

              <ToggleRow
                title={t('dates.showOutsideDays')}
                description={t('dates.showOutsideDaysDescription')}
                checked={settings.showOutsideDays}
                onCheckedChange={(checked) => updateSettings({ showOutsideDays: checked })}
              />

              <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
                <p className="font-medium">{t('dates.previewLabel')}</p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">{formattedPreviewDate}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <DayPicker
                mode="single"
                selected={previewDate}
                onSelect={setPreviewDate}
                showOutsideDays={settings.showOutsideDays}
                weekStartsOn={settings.weekStartsOn}
                className="mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'workflow' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('workflow.title')}</CardTitle>
              <CardDescription>{t('workflow.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title={t('workflow.hotkeyHints')}
                description={t('workflow.hotkeyHintsDescription')}
                checked={settings.showHotkeyHints}
                onCheckedChange={(checked) => updateSettings({ showHotkeyHints: checked })}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">G H</Badge>
                <Badge variant="secondary">G A</Badge>
                <Badge variant="secondary">G F</Badge>
                <Badge variant="secondary">G P</Badge>
                <Badge variant="secondary">?</Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('workflow.hotkeySummary')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle>{t('profilePictureTitle')}</CardTitle>
              <CardDescription>{t('profilePictureDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileImageForm
                currentImage={session?.user.image ?? null}
                labels={{
                  upload: t('form.upload'),
                  uploading: t('form.uploading'),
                  remove: t('form.remove'),
                  chooseImage: t('form.chooseImage'),
                  hint: t('form.hint'),
                  success: t('form.success'),
                  empty: t('form.empty'),
                  alt: t('form.alt'),
                  cropTitle: t('form.cropTitle'),
                  cropDescription: t('form.cropDescription'),
                  cropZoom: t('form.cropZoom'),
                  cropCancel: t('form.cropCancel'),
                  cropApply: t('form.cropApply'),
                  ready: t('form.ready'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'notifications' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.title')}</CardTitle>
            <CardDescription>{t('notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ToggleRow
              title={t('notifications.enabled')}
              description={t('notifications.enabledDescription')}
              checked={settings.notifications.enabled}
              onCheckedChange={(checked) => updateNotificationSettings({ enabled: checked })}
            />

            <div className="space-y-2">
              <Label htmlFor="notification-type">{t('notifications.typeLabel')}</Label>
              <Input
                id="notification-type"
                value={settings.notifications.type}
                placeholder={t('notifications.typePlaceholder')}
                onChange={(event) => updateNotificationSettings({ type: event.target.value })}
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('notifications.typeDescription')}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'account' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.email.title')}</CardTitle>
              <CardDescription>{t('account.email.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountEmailForm
                currentEmail={session?.user.email ?? ''}
                labels={{
                  currentEmail: t('account.email.currentEmail'),
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

          <Card className="border-red-200 dark:border-red-900/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>{t('account.deletion.title')}</CardTitle>
                <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                  {t('account.deletion.badge')}
                </Badge>
              </div>
              <CardDescription>{t('account.deletion.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100">
                {t('account.deletion.warning')}
              </div>
              <AccountDeleteForm
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
      ) : null}

      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('saveState')}</p>
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
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
      <p className="font-medium">{title}</p>
      <Badge variant={enabled ? 'default' : 'outline'} className="mt-3">
        {enabled ? enabledLabel : disabledLabel}
      </Badge>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={[
          'relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors',
          checked
            ? 'border-zinc-900 bg-zinc-900 dark:border-zinc-50 dark:bg-zinc-50'
            : 'border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800',
        ].join(' ')}
        onClick={() => onCheckedChange(!checked)}
      >
        <span
          className={[
            'mt-0.5 ml-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-950',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

const selectClassName = [
  'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
  'dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-50',
].join(' ');
