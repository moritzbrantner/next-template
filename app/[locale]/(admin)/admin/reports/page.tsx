import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocalizedLink } from '@/i18n/server-link';
import { getEnabledAdminPageDefinitions } from '@/src/admin/pages';
import { getAdminReportSummaryUseCase } from '@/src/domain/admin-reports/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { notFoundUnlessFeatureEnabled, resolveLocale } from '@/src/server/page-guards';

const reportCatalogKeys = ['securityAccess', 'auditActivity', 'workspaceAdoption', 'schemaHealth'] as const;
const reportAlertKeys = ['dailyDigest', 'weeklyExecutive', 'failedIngestion'] as const;

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  notFoundUnlessFeatureEnabled('admin.reports');
  const t = createTranslator(locale, 'AdminPage');
  const adminPages = getEnabledAdminPageDefinitions();
  const summary = await getAdminReportSummaryUseCase('7d').catch(() => ({
    metrics: [
      { label: 'Admin accounts', value: '0', detail: 'Report data is temporarily unavailable.' },
      { label: 'Denied admin actions', value: '0', detail: 'Report data is temporarily unavailable.' },
      { label: 'Admin visits', value: '0', detail: 'Report data is temporarily unavailable.' },
    ],
  }));

  return (
    <AdminPageShell title={t('reports.title')} description={t('reports.description')} adminPages={adminPages}>
      <div className="grid gap-4 md:grid-cols-3">
        {summary.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.catalogTitle')}</CardTitle>
          <CardDescription>{t('reports.catalogDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.columns.report')}</TableHead>
                <TableHead>{t('reports.columns.owner')}</TableHead>
                <TableHead>{t('reports.columns.cadence')}</TableHead>
                <TableHead>{t('reports.columns.status')}</TableHead>
                <TableHead className="text-right">{t('reports.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportCatalogKeys.map((reportKey) => (
                <TableRow key={reportKey}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{t(`reports.catalog.${reportKey}.title`)}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`reports.catalog.${reportKey}.description`)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{t(`reports.catalog.${reportKey}.owner`)}</TableCell>
                  <TableCell>{t(`reports.catalog.${reportKey}.cadence`)}</TableCell>
                  <TableCell><Badge variant="secondary">{t('reports.ready')}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <LocalizedLink
                        href={`/admin/reports/${reportKey}`}
                        locale={locale}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        {t('reports.actions.open')}
                      </LocalizedLink>
                      <a
                        href={`/api/admin/reports/${reportKey}?window=7d&format=csv`}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        download
                      >
                        {t('reports.actions.export')}
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.alertsTitle')}</CardTitle>
          <CardDescription>{t('reports.alertsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {reportAlertKeys.map((alertKey) => (
            <div key={alertKey} className="rounded-2xl border p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{t(`reports.alerts.${alertKey}.title`)}</p>
                <Badge variant="outline">{t(`reports.alerts.${alertKey}.channel`)}</Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t(`reports.alerts.${alertKey}.description`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
