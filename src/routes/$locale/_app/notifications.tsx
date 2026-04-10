import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { Link } from '@/i18n/navigation';
import { MarkAllReadButton } from '@/components/notifications/mark-all-read-button';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getNotificationsPageDataUseCase } from '@/src/domain/notifications/use-cases';
import { useTranslations } from '@/src/i18n';

const summaryKeys = ['unread', 'today', 'preferences'] as const;

const badgeVariants = {
  unread: 'default',
  read: 'secondary',
} as const;

const loadNotificationsPage = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId?: string } | undefined) => ({
    userId: typeof input?.userId === 'string' ? input.userId : '',
  }))
  .handler(async ({ data }) => {
    return getNotificationsPageDataUseCase(data.userId);
  });

export const Route = createFileRoute('/$locale/_app/notifications')({
  beforeLoad: ({ context, params }) => {
    if (!context.session?.user?.id) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }
  },
  loader: ({ context }) => loadNotificationsPage({ data: { userId: context.session!.user.id } }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const t = useTranslations('NotificationsPage');
  const data = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const userLabel = session?.user.name ?? session?.user.email ?? t('fallbackUser');

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden rounded-[2rem] border-zinc-200 bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_26%),radial-gradient(circle_at_right,#dbeafe,transparent_24%),linear-gradient(145deg,#ffffff,#f4f4f5)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,#713f12,transparent_24%),radial-gradient(circle_at_right,#1d4ed8,transparent_24%),linear-gradient(145deg,#09090b,#18181b)]">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{t('badge')}</Badge>
            <Badge variant="outline">{session?.user.role ?? 'USER'}</Badge>
          </div>

          <div className="space-y-3">
            <CardTitle className="text-3xl tracking-tight">{t('title')}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {t('description', { name: userLabel })}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 md:grid-cols-3">
          {summaryKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                {t(`summary.${key}.label`)}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {key === 'unread' ? String(data.unreadCount) : key === 'today' ? String(data.todayCount) : t('summary.preferences.value')}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t(`summary.${key}.hint`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{t('feed.title')}</CardTitle>
                <CardDescription>{t('feed.description')}</CardDescription>
              </div>
              <MarkAllReadButton disabled={data.unreadCount === 0} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.items.length > 0 ? (
              data.items.map((item) => {
                const status = item.status as keyof typeof badgeVariants;
                const content = (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={badgeVariants[status]}>{t(`feed.status.${item.status}`)}</Badge>
                          <span className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                            {formatNotificationDate(item.createdAt)}
                          </span>
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{item.title}</h2>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.body}</p>
                  </>
                );

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
                  >
                    {content}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {t('feed.empty')}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>{t('actions.title')}</CardTitle>
              <CardDescription>{t('actions.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/profile" className={buttonVariants({ variant: 'default' })}>
                {t('actions.profile')}
              </Link>
              <Link href="/settings" className={buttonVariants({ variant: 'outline' })}>
                {t('actions.settings')}
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>{t('preferences.title')}</CardTitle>
              <CardDescription>{t('preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
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

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
