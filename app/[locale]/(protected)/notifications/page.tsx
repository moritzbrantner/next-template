import { NotificationsFeedCard } from '@/components/notifications/notifications-feed-card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalizedLink } from '@/i18n/server-link';

import { getNotificationsPageDataUseCase } from '@/src/domain/notifications/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { notFoundUnlessFeatureEnabledForUser, requireAuth, resolveLocale } from '@/src/server/page-guards';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const session = await requireAuth(locale);
  await notFoundUnlessFeatureEnabledForUser('notifications', session.user);
  const t = createTranslator(locale, 'NotificationsPage');
  const data = await getNotificationsPageDataUseCase(session.user.id);
  const userName = session.user.name?.trim() || session.user.email?.split('@')[0] || t('fallbackUser');

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-3">
        <Badge variant="secondary">{t('badge')}</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
            {t('description', { name: userName })}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t('summary.unread.label')}
          value={String(data.unreadCount)}
          description={t('summary.unread.hint')}
        />
        <SummaryCard
          title={t('summary.today.label')}
          value={String(data.todayCount)}
          description={t('summary.today.hint')}
        />
        <SummaryCard
          title={t('summary.preferences.label')}
          value={t('summary.preferences.value')}
          description={t('summary.preferences.hint')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <NotificationsFeedCard items={data.items} unreadCount={data.unreadCount} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('actions.title')}</CardTitle>
              <CardDescription>{t('actions.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <LocalizedLink href="/profile" locale={locale} className={buttonVariants({ variant: 'default' })}>
                {t('actions.profile')}
              </LocalizedLink>
              <LocalizedLink href="/settings" locale={locale} className={buttonVariants({ variant: 'outline' })}>
                {t('actions.settings')}
              </LocalizedLink>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('preferences.title')}</CardTitle>
              <CardDescription>{t('preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              <p>{t('preferences.email')}</p>
              <p>{t('preferences.push')}</p>
              <p>{t('preferences.digest')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
      </CardContent>
    </Card>
  );
}
