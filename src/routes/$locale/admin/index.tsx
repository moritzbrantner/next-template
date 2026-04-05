import { createFileRoute } from '@tanstack/react-router';

import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPageAccess } from '@/src/admin/access';
import { adminWorkspacePageDefinitions } from '@/src/admin/pages';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/admin/')({
  beforeLoad: ({ context, params }) => {
    requireAdminPageAccess(context.session, params.locale as AppLocale);
  },
  component: AdminPage,
});

function AdminPage() {
  const t = useTranslations('AdminPage');
  const { locale } = Route.useParams();

  return (
    <AdminPageShell title={t('overview.title')} description={t('overview.description')}>
      <div className="grid gap-4 md:grid-cols-2">
        {adminWorkspacePageDefinitions.map((page) => (
          <Card key={page.key}>
            <CardHeader>
              <CardTitle>{t(`${page.key}.title`)}</CardTitle>
              <CardDescription>{t(`${page.key}.description`)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={page.href}
                locale={locale as AppLocale}
                className="inline-block text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {t('overview.openWorkspace')}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
