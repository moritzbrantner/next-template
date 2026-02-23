import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/src/auth';
import { getAdminAuthorization } from '@/src/domain/authorization/use-cases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const authorization = getAdminAuthorization(session);

  if (!authorization.ok) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('AdminPage');
  const { actions } = authorization.data;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {actions.map((action) => (
            <li key={action.key} className="rounded-lg border p-3 dark:border-zinc-800">
              <p className="font-medium">{t(`actions.${action.key}.title`)}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {t(`actions.${action.key}.description`)}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {action.allowed ? t('status.allowed') : t('status.denied')}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
