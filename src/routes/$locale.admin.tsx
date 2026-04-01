import { createFileRoute, redirect } from '@tanstack/react-router';

import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminAuthorization } from '@/src/domain/authorization/use-cases';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/admin')({
  beforeLoad: ({ context, params }) => {
    const authorization = getAdminAuthorization(context.session);

    if (!authorization.ok) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }

    return {
      authorization: authorization.data,
    };
  },
  component: AdminPage,
});

function AdminPage() {
  const t = useTranslations('AdminPage');
  const { authorization } = Route.useRouteContext();
  const { locale } = Route.useParams();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {authorization.actions.map((action) => (
            <li key={action.key} className="rounded-lg border p-3 dark:border-zinc-800">
              <p className="font-medium">{t(`actions.${action.key}.title`)}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t(`actions.${action.key}.description`)}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {action.allowed ? t('status.allowed') : t('status.denied')}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg border p-3 dark:border-zinc-800">
          <p className="font-medium">Schema-driven data studio</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Generate forms from <code>db-schema.json</code> and write records to selected DB tables.
          </p>
          <Link
            href="/admin/data-studio"
            locale={locale as AppLocale}
            className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Open data studio →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
