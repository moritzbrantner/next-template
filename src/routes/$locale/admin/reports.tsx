import { createFileRoute } from '@tanstack/react-router';

import type { AppLocale } from '@/i18n/routing';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireAdminPageAccess } from '@/src/admin/access';
import { useTranslations } from '@/src/i18n';

const reportMetricKeys = ['coverage', 'auditTrail', 'refreshCadence'] as const;
const reportCatalogKeys = ['securityAccess', 'auditActivity', 'workspaceAdoption', 'schemaHealth'] as const;
const reportAlertKeys = ['dailyDigest', 'weeklyExecutive', 'failedIngestion'] as const;

export const Route = createFileRoute('/$locale/admin/reports')({
  beforeLoad: ({ context, params }) => {
    requireAdminPageAccess(context.session, params.locale as AppLocale);
  },
  component: ReportsPage,
});

function ReportsPage() {
  const t = useTranslations('AdminPage');

  return (
    <AdminPageShell title={t('reports.title')} description={t('reports.description')}>
      <div className="grid gap-4 md:grid-cols-3">
        {reportMetricKeys.map((metricKey) => (
          <Card key={metricKey}>
            <CardHeader>
              <CardDescription>{t(`reports.metrics.${metricKey}.label`)}</CardDescription>
              <CardTitle className="text-3xl">{t(`reports.metrics.${metricKey}.value`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`reports.metrics.${metricKey}.detail`)}</p>
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
                  <TableCell>
                    <Badge variant="secondary">{t('reports.ready')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm">
                        {t('reports.actions.open')}
                      </Button>
                      <Button type="button" variant="ghost" size="sm">
                        {t('reports.actions.export')}
                      </Button>
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
