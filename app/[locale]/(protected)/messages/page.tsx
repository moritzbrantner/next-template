import { notFound } from 'next/navigation';

import { MessagesWorkspace } from '@/components/messages/messages-workspace';
import { getDirectMessagesPageDataUseCase } from '@/src/domain/messages/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { notFoundUnlessFeatureEnabled, requireAuth, resolveLocale } from '@/src/server/page-guards';

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ with?: string | string[] }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  notFoundUnlessFeatureEnabled('messages.direct');
  const session = await requireAuth(locale);
  const resolvedSearchParams = await searchParams;
  const requestedTarget = Array.isArray(resolvedSearchParams.with)
    ? resolvedSearchParams.with[0]
    : resolvedSearchParams.with;
  const result = await getDirectMessagesPageDataUseCase(session.user.id, requestedTarget);
  const t = createTranslator(locale, 'MessagesPage');

  if (!result.ok) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t('description')}</p>
      </header>

      <MessagesWorkspace initialData={result.data} />
    </section>
  );
}
