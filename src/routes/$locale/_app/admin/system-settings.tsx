import { createFileRoute } from '@tanstack/react-router';

import type { AppLocale } from '@/i18n/routing';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPageAccess } from '@/src/admin/access';
import { useTranslations } from '@/src/i18n';

const settingGroupKeys = ['sessions', 'notifications', 'storage'] as const;
const settingsByGroup = {
  sessions: ['sessionLifetime', 'idleTimeout', 'mfaPolicy'],
  notifications: ['digestCadence', 'incidentRouting', 'maintenanceWindow'],
  storage: ['uploadLimit', 'retentionWindow', 'auditExports'],
} as const;
const checklistKeys = ['review', 'announce', 'verify'] as const;

export const Route = createFileRoute('/$locale/_app/admin/system-settings')({
  beforeLoad: ({ context, params }) => {
    requireAdminPageAccess(context.session, params.locale as AppLocale);
  },
  component: SystemSettingsPage,
});

function SystemSettingsPage() {
  const t = useTranslations('AdminPage');
  console.log('Rendering System Settings Page'); // Debug log to verify rendering

  return (
    <AdminPageShell title={t('systemSettings.title')} description={t('systemSettings.description')}>
      <div className="grid gap-4 md:grid-cols-3">
        {settingGroupKeys.map((groupKey) => (
          <Card key={groupKey}>
            <CardHeader>
              <CardTitle>{t(`systemSettings.groups.${groupKey}.title`)}</CardTitle>
              <CardDescription>{t(`systemSettings.groups.${groupKey}.description`)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsByGroup[groupKey].map((settingKey) => (
                <div key={settingKey} className="rounded-2xl border p-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{t(`systemSettings.settings.${settingKey}.label`)}</p>
                    <Badge variant="outline">{t(`systemSettings.settings.${settingKey}.scope`)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t(`systemSettings.settings.${settingKey}.value`)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm">
                      {t('systemSettings.actions.edit')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      {t('systemSettings.actions.audit')}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('systemSettings.checklistTitle')}</CardTitle>
          <CardDescription>{t('systemSettings.checklistDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {checklistKeys.map((checklistKey, index) => (
              <li key={checklistKey} className="flex gap-3 rounded-2xl border p-4 dark:border-zinc-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {index + 1}
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">{t(`systemSettings.checklist.${checklistKey}`)}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
