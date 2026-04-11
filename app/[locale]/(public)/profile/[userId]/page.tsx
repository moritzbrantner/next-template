import { notFound } from 'next/navigation';

import { ProfileFollowPanel } from '@/components/profile-follow-panel';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getAuthSession } from '@/src/auth.server';
import { getProfileViewUseCase } from '@/src/domain/profile/use-cases';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale: rawLocale, userId } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'ProfilePage');
  const blogT = createTranslator(locale, 'BlogPage');
  const session = await getAuthSession();
  const viewerUserId = session?.user.id ?? null;
  const result = await getProfileViewUseCase(userId, viewerUserId);

  if (!result.ok) {
    notFound();
  }

  const profile = result.data;

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-3xl space-y-1 px-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t('view.title')}</h1>
        <CardDescription>{t('view.description')}</CardDescription>
      </div>

      <ProfileFollowPanel
        locale={locale}
        profileUserId={profile.userId}
        displayName={profile.displayName}
        imageUrl={profile.imageUrl}
        initialFollowerCount={profile.followerCount}
        initialIsFollowing={profile.isFollowing}
        isOwnProfile={profile.isOwnProfile}
        canManageFollowState={Boolean(viewerUserId)}
        labels={{
          followers: t('view.followers'),
          follow: t('view.follow'),
          unfollow: t('view.unfollow'),
          following: t('view.following'),
          unfollowing: t('view.unfollowing'),
          editProfile: t('view.editProfile'),
          error: t('view.error'),
        }}
      />

      <Card className="mx-auto max-w-3xl">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{blogT('profileCard.title')}</CardTitle>
            <CardDescription>{blogT('profileCard.description', { name: profile.displayName })}</CardDescription>
          </div>

          <Link
            href={`/profile/${profile.userId}/blog`}
            locale={locale}
            className={buttonVariants({ variant: 'default' })}
          >
            {blogT('profileCard.open')}
          </Link>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{blogT('profileCard.caption')}</p>
        </CardContent>
      </Card>
    </section>
  );
}
