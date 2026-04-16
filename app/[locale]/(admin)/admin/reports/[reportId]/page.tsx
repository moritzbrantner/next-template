import { notFound } from 'next/navigation';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminReportChart } from '@/components/admin/admin-report-chart';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocalizedLink } from '@/i18n/server-link';
import { getEnabledAdminPageDefinitions } from '@/src/admin/pages';
import {
  adminReportWindows,
  getAdminReportDetailUseCase,
  isAdminReportId,
  isAdminReportWindow,
} from '@/src/domain/admin-reports/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { getAdminAnalyticsSettings } from '@/src/site-config/service';
import { notFoundUnlessFeatureEnabled, resolveLocale } from '@/src/server/page-guards';

export default async function AdminReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; reportId: string }>;
  searchParams: Promise<{ window?: string }>;
}) {
  const [{ locale: rawLocale, reportId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(rawLocale);
  notFoundUnlessFeatureEnabled('admin.reports');

  if (!isAdminReportId(reportId)) {
    notFound();
  }

  const analyticsSettings = await getAdminAnalyticsSettings();
  const requestedWindow = rawSearchParams.window ?? '';
  const window = isAdminReportWindow(requestedWindow) ? requestedWindow : analyticsSettings.defaultAdminReportWindow;
  const t = createTranslator(locale, 'AdminPage');
  const adminPages = getEnabledAdminPageDefinitions();
  const detail = await getAdminReportDetailUseCase(reportId, window);

  return (
    <AdminPageShell
      title={t(`reports.catalog.${reportId}.title`)}
      description={t(`reports.catalog.${reportId}.description`)}
      adminPages={adminPages}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LocalizedLink href="/admin/reports" locale={locale} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back to reports
        </LocalizedLink>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{detail.status === 'degraded' ? 'Degraded data' : 'Live data'}</Badge>
          {adminReportWindows.map((candidateWindow) => (
            <LocalizedLink
              key={candidateWindow}
              href={`/admin/reports/${reportId}?window=${candidateWindow}`}
              locale={locale}
              className={buttonVariants({
                variant: candidateWindow === window ? 'default' : 'outline',
                size: 'sm',
              })}
            >
              {candidateWindow}
            </LocalizedLink>
          ))}
          <a
            href={`/api/admin/reports/${reportId}?window=${window}&format=csv`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            download
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Generated {detail.generatedAt} for the {detail.window} window.
        </p>
        {detail.message ? (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{detail.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {detail.cards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            {card.detail ? (
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{card.detail}</p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      {detail.series.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {detail.series.map((series) => (
            <Card key={series.id}>
              <CardHeader>
                <CardTitle>{series.title}</CardTitle>
                <CardDescription>{series.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminReportChart series={series} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {detail.breakdowns.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {detail.breakdowns.map((breakdown) => (
            <Card key={breakdown.id}>
              <CardHeader>
                <CardTitle>{breakdown.title}</CardTitle>
                <CardDescription>{breakdown.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {breakdown.rows.length > 0 ? (
                  <div className="space-y-3">
                    {breakdown.rows.map((row) => (
                      <div
                        key={`${breakdown.id}-${row.label}`}
                        className="flex items-start justify-between gap-4 rounded-2xl border p-3 dark:border-zinc-800"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{row.label}</p>
                          {row.detail ? (
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">{row.detail}</p>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{row.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{breakdown.emptyMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
          <CardDescription>Live operational output for the selected time window.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.table.rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {detail.table.columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.table.rows.map((row, rowIndex) => (
                  <TableRow key={`${rowIndex}-${row.join('|')}`}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${rowIndex}-${cellIndex}`}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{detail.table.emptyMessage}</p>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
