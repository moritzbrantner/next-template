import { useState } from 'react';

import {
  Badge,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@moritzbrantner/ui';
import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  canAccessAdminArea,
  canManageSystemSettings,
  canManageUsers,
  canViewReports,
} from '@/lib/authorization';
import { ProfileImageForm } from '@/components/profile-image-form';
import { useTranslations } from '@/src/i18n';
import {
  backgroundOptions,
  formatDatePreview,
  type BackgroundOption,
} from '@/src/settings/preferences';
import { useAppSettings } from '@/src/settings/provider';

const backgroundSwatches: Record<BackgroundOption, string> = {
  paper: 'from-amber-100 via-white to-zinc-200',
  aurora: 'from-sky-200 via-cyan-100 to-emerald-200',
  dusk: 'from-rose-200 via-orange-100 to-indigo-200',
  forest: 'from-emerald-200 via-lime-100 to-stone-200',
};

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

  const role = session?.user.role ?? 'USER';
  const formattedPreviewDate = formatDatePreview(previewDate ?? new Date(), settings, locale);

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

      <Tabs defaultValue="appearance">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="appearance">{t('tabs.appearance')}</TabsTrigger>
          <TabsTrigger value="dates">{t('tabs.dates')}</TabsTrigger>
          <TabsTrigger value="workflow">{t('tabs.workflow')}</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-4">
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
                      <p className="mt-1 text-sm opacity-80">
                        {t(`appearance.backgrounds.${backgroundOption}.description`)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Separator />

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
        </TabsContent>

        <TabsContent value="dates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dates.title')}</CardTitle>
              <CardDescription>{t('dates.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('dates.formatLabel')}</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      updateSettings({
                        dateFormat: value as 'localized' | 'long' | 'iso',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="localized">{t('dates.formats.localized')}</SelectItem>
                      <SelectItem value="long">{t('dates.formats.long')}</SelectItem>
                      <SelectItem value="iso">{t('dates.formats.iso')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('dates.weekStartsLabel')}</Label>
                  <Select
                    value={String(settings.weekStartsOn)}
                    onValueChange={(value) =>
                      updateSettings({
                        weekStartsOn: value === '0' ? 0 : 1,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('dates.weekStarts.monday')}</SelectItem>
                      <SelectItem value="0">{t('dates.weekStarts.sunday')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Calendar
                  mode="single"
                  selected={previewDate}
                  onSelect={setPreviewDate}
                  showOutsideDays={settings.showOutsideDays}
                  weekStartsOn={settings.weekStartsOn}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-4 space-y-4">
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
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
