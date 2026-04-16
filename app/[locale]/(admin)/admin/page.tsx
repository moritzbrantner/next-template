import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminOverviewGrid } from '@/components/admin/admin-overview-grid';
import { getEnabledAdminPageDefinitions, getEnabledAdminWorkspacePageDefinitions } from '@/src/admin/pages';
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
  const pages = getEnabledAdminWorkspacePageDefinitions().map((page) => ({
    key: page.key,
    href: page.href,
    title: t(`${page.key}.title`),
    description: t(`${page.key}.description`),
  }));

  return (
    <AdminPageShell title={t('overview.title')} description={t('overview.description')} adminPages={adminPages}>
      <AdminOverviewGrid pages={pages} />
    </AdminPageShell>
  );
}
