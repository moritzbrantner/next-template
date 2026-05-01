import { ProfileDisplayNameForm } from '@/components/profile-display-name-form';
import { ProfileImageForm } from '@/components/profile-image-form';
import { ProfileTagForm } from '@/components/profile-tag-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { LocalizedLink } from '@/i18n/server-link';
import {
  getProfileFollowerVisibilityUseCase,
  getProfileSearchVisibilityUseCase,
  getProfileViewUseCase,
  listFollowingProfilesUseCase,
} from '@/src/domain/profile/use-cases';
import { buildPublicProfileBlogPath, buildPublicProfilePath } from '@/src/profile/tags';
import { createTranslator } from '@/src/i18n/messages';
import { requireAuth, resolveLocale } from '@/src/server/page-guards';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const session = await requireAuth(locale);
  const t = createTranslator(locale, 'ProfilePage');
  const blogT = createTranslator(locale, 'BlogPage');
  const peopleT = createTranslator(locale, 'PeoplePage');
  const settingsT = createTranslator(locale, 'SettingsPage');
  const [profileViewResult, searchVisibilityResult, followerVisibilityResult, followingResult] = await Promise.all([
    getProfileViewUseCase(session.user.id, session.user.id),
    getProfileSearchVisibilityUseCase(session.user.id),
    getProfileFollowerVisibilityUseCase(session.user.id),
    listFollowingProfilesUseCase(session.user.id),
  ]);
  const displayName = session.user.name ?? session.user.email?.split('@')[0] ?? 'User';
  const followerCount = profileViewResult.ok ? profileViewResult.data.followerCount : 0;
  const followingCount = followingResult.ok ? followingResult.data.profiles.length : 0;
  const isSearchable = searchVisibilityResult.ok ? searchVisibilityResult.data.isSearchable : true;
  const followerVisibility = followerVisibilityResult.ok ? followerVisibilityResult.data.followerVisibility : 'PUBLIC';

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t('description')}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('form.chooseImage')}</CardTitle>
            <CardDescription>{displayName}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileImageForm
              currentImage={session.user.image ?? null}
              labels={{
                chooseImage: t('form.chooseImage'),
                hint: t('form.hint'),
                upload: t('form.upload'),
                uploading: t('form.uploading'),
                remove: t('form.remove'),
                success: t('form.success'),
                empty: t('form.empty'),
                alt: t('form.alt'),
                cropTitle: t('form.cropTitle'),
                cropDescription: t('form.cropDescription'),
                cropZoom: t('form.cropZoom'),
                cropCancel: t('form.cropCancel'),
                cropApply: t('form.cropApply'),
                ready: t('form.ready'),
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{displayName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <StatCard label={t('view.followers')} value={String(followerCount)} />
              <StatCard label={peopleT('following.title')} value={String(followingCount)} />
              <StatCard
                label={settingsT('privacy.title')}
                value={`${isSearchable ? 'Searchable' : 'Private'} · ${followerVisibility}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('form.displayName.label')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileDisplayNameForm
                currentDisplayName={displayName}
                labels={{
                  label: t('form.displayName.label'),
                  placeholder: t('form.displayName.placeholder'),
                  save: t('form.displayName.save'),
                  saving: t('form.displayName.saving'),
                  success: t('form.displayName.success'),
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('form.tag.label')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileTagForm
                currentTag={session.user.tag ?? ''}
                labels={{
                  label: t('form.tag.label'),
                  placeholder: t('form.tag.placeholder'),
                  hint: t('form.tag.hint'),
                  save: t('form.tag.save'),
                  saving: t('form.tag.saving'),
                  success: t('form.tag.success'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{blogT('editor.cardTitle')}</CardTitle>
          <CardDescription>{blogT('editor.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <LocalizedLink
            href="/profile/blog"
            locale={locale}
            className={buttonVariants({ variant: 'default' })}
          >
            {blogT('editor.openComposer')}
          </LocalizedLink>
          <LocalizedLink
            href={session.user.tag ? buildPublicProfileBlogPath(session.user.tag) : '/profile/blog'}
            locale={locale}
            className={buttonVariants({ variant: 'outline' })}
          >
            {blogT('editor.viewPublicBlog')}
          </LocalizedLink>
          <LocalizedLink
            href={session.user.tag ? buildPublicProfilePath(session.user.tag) : '/profile'}
            locale={locale}
            className={buttonVariants({ variant: 'outline' })}
          >
            {t('form.tag.viewProfile')}
          </LocalizedLink>
        </CardContent>
      </Card>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
