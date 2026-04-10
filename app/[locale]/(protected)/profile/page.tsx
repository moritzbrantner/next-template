import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileDisplayNameForm } from '@/components/profile-display-name-form';
import { ProfileImageForm } from '@/components/profile-image-form';
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

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <ProfileDisplayNameForm
          currentDisplayName={session.user.name ?? ''}
          labels={{
            label: t('form.displayName.label'),
            placeholder: t('form.displayName.placeholder'),
            save: t('form.displayName.save'),
            saving: t('form.displayName.saving'),
            success: t('form.displayName.success'),
          }}
        />

        <ProfileImageForm
          currentImage={session.user.image ?? null}
          labels={{
            upload: t('form.upload'),
            uploading: t('form.uploading'),
            remove: t('form.remove'),
            chooseImage: t('form.chooseImage'),
            hint: t('form.hint'),
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
  );
}
