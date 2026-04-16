import { notFound } from 'next/navigation';

import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocalizedLink } from '@/i18n/server-link';
import {
  adminReportWindows,
  getAdminReportDetailUseCase,
  isAdminReportId,
  isAdminReportWindow,
} from '@/src/domain/admin-reports/use-cases';
import { createTranslator } from '@/src/i18n/messages';
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

  const requestedWindow = rawSearchParams.window ?? '';
  const window = isAdminReportWindow(requestedWindow) ? requestedWindow : '7d';
  const t = createTranslator(locale, 'AdminPage');
  const detail = await getAdminReportDetailUseCase(reportId, window).catch(() => ({
    reportId,
    cards: [{ label: 'Report status', value: 'Unavailable', detail: 'Live data could not be loaded for this report.' }],
    table: {
      columns: ['Message'],
      rows: [],
      emptyMessage: 'Report data is temporarily unavailable.',
    },
  }));

  return (
    <AdminPageShell
      title={t(`reports.catalog.${reportId}.title`)}
      description={t(`reports.catalog.${reportId}.description`)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LocalizedLink href="/admin/reports" locale={locale} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back to reports
        </LocalizedLink>

        <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {detail.cards.map((card) => (
          <Card key={card.label}>
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

      <Card>
        <CardHeader>
          <CardTitle>Report data</CardTitle>
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
