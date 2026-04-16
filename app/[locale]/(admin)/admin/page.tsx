import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalizedLink } from '@/i18n/server-link';
import { getEnabledAdminWorkspacePageDefinitions } from '@/src/admin/pages';
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
  const pages = getEnabledAdminWorkspacePageDefinitions();

  return (
    <AdminPageShell title={t('overview.title')} description={t('overview.description')}>
      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => (
          <Card key={page.key}>
            <CardHeader>
              <CardTitle>{t(`${page.key}.title`)}</CardTitle>
              <CardDescription>{t(`${page.key}.description`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <LocalizedLink href={page.href} locale={locale} className="inline-block text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                {t('overview.openWorkspace')}
              </LocalizedLink>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
