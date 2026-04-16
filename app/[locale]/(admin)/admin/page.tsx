import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminReportChart } from '@/components/admin/admin-report-chart';
import { AdminOverviewGrid } from '@/components/admin/admin-overview-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalizedLink } from '@/i18n/server-link';
import { getEnabledAdminPageDefinitions, getEnabledAdminWorkspacePageDefinitions } from '@/src/admin/pages';
import { getAdminReportSummaryUseCase } from '@/src/domain/admin-reports/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'AdminPage');
  const adminPages = getEnabledAdminPageDefinitions();
  const pulse = await getAdminReportSummaryUseCase('7d');
  const pages = getEnabledAdminWorkspacePageDefinitions().map((page) => ({
    key: page.key,
    href: page.href,
    title: t(`${page.key}.title`),
    description: t(`${page.key}.description`),
  }));

  return (
    <AdminPageShell title={t('overview.title')} description={t('overview.description')} adminPages={adminPages}>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Operational pulse</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Live admin health for the last 7 days. Refreshed {pulse.generatedAt}.
          </p>
        </div>

        {pulse.status === 'degraded' ? (
          <div className="rounded-3xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {pulse.message ?? 'Data unavailable.'}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pulse.metrics.map((metric) => {
              const href = `${metric.href}?window=${pulse.window}`;

              return (
                <LocalizedLink key={metric.id} href={href} locale={locale} className="block">
                  <Card className="h-full transition-colors hover:border-emerald-400 dark:hover:border-emerald-700">
                    <CardHeader className="space-y-2">
                      <CardDescription>{metric.label}</CardDescription>
                      <CardTitle className="text-3xl">{metric.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">{metric.detail}</p>
                      {metric.change ? (
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                          {metric.change.value} {metric.change.detail}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </LocalizedLink>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardDescription>7-day admin visits</CardDescription>
              <CardTitle className="text-xl">Visit trend</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminReportChart series={pulse.series[0]} />
            </CardContent>
          </Card>
        </div>
      </section>

      <AdminOverviewGrid pages={pages} />
    </AdminPageShell>
  );
}
