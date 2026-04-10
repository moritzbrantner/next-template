import { notFound } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import type { AppLocale } from '@/i18n/routing';
import { ProfileFollowPanel } from '@/components/profile-follow-panel';
import { CardDescription } from '@/components/ui/card';
import { getAuthSession } from '@/src/auth.server';
import { getProfileViewUseCase } from '@/src/domain/profile/use-cases';
import { useTranslations } from '@/src/i18n';

type LoadProfileInput = {
  profileUserId?: string;
};

const loadProfileView = createServerFn({ method: 'GET' })
  .inputValidator((input: LoadProfileInput | undefined) => ({
    profileUserId: typeof input?.profileUserId === 'string' ? input.profileUserId : '',
  }))
  .handler(async ({ data }) => {
    const session = await getAuthSession();
    const viewerUserId = session?.user.id ?? null;
    const result = await getProfileViewUseCase(data.profileUserId, viewerUserId);

    return result.ok
      ? {
          canManageFollowState: Boolean(viewerUserId),
          profile: result.data,
        }
      : null;
  });

export const Route = createFileRoute('/$locale/_public/profile/$userId')({
  loader: async ({ params }) => {
    const profile = await loadProfileView({
      data: {
        profileUserId: params.userId,
      },
    });

    if (!profile) {
      throw notFound();
    }

    return profile;
  },
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const t = useTranslations('ProfilePage');
  const { locale } = Route.useParams();
  const { canManageFollowState, profile } = Route.useLoaderData();

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-3xl space-y-1 px-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t('view.title')}</h1>
        <CardDescription>{t('view.description')}</CardDescription>
      </div>

      <ProfileFollowPanel
        locale={locale as AppLocale}
        profileUserId={profile.userId}
        displayName={profile.displayName}
        imageUrl={profile.imageUrl}
        initialFollowerCount={profile.followerCount}
        initialIsFollowing={profile.isFollowing}
        isOwnProfile={profile.isOwnProfile}
        canManageFollowState={canManageFollowState}
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
    </section>
  );
}
