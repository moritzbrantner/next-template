import { notFound } from 'next/navigation';

import { PeopleDirectory } from '@/components/people-directory';

import {
  listFriendProfilesUseCase,
  listFollowingProfilesUseCase,
} from '@/src/domain/profile/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { notFoundUnlessFeatureEnabledForUser, requireAuth, resolveLocale } from '@/src/server/page-guards';

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const session = await requireAuth(locale);
  await notFoundUnlessFeatureEnabledForUser('people.directory', session.user);
  const t = createTranslator(locale, 'PeoplePage');
  const [followingResult, friendsResult] = await Promise.all([
    listFollowingProfilesUseCase(session.user.id),
    listFriendProfilesUseCase(session.user.id),
  ]);

  if (!followingResult.ok || !friendsResult.ok) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t('description')}</p>
      </header>

      <PeopleDirectory
        initialFollowing={followingResult.data.profiles}
        initialFriends={friendsResult.data.profiles}
      />
    </section>
  );
}
