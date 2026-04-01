import { createFileRoute, redirect } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileDisplayNameForm } from '@/components/profile-display-name-form';
import { ProfileImageForm } from '@/components/profile-image-form';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/profile')({
  beforeLoad: ({ context, params }) => {
    if (!context.session?.user?.id) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const t = useTranslations('ProfilePage');
  const { session } = Route.useRouteContext();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <ProfileDisplayNameForm
          currentDisplayName={session?.user.name ?? ''}
          labels={{
            label: t('form.displayName.label'),
            placeholder: t('form.displayName.placeholder'),
            save: t('form.displayName.save'),
            saving: t('form.displayName.saving'),
            success: t('form.displayName.success'),
          }}
        />

        <ProfileImageForm
          currentImage={session?.user.image ?? null}
          labels={{
            upload: t('form.upload'),
            uploading: t('form.uploading'),
            remove: t('form.remove'),
            chooseImage: t('form.chooseImage'),
            hint: t('form.hint'),
            success: t('form.success'),
            empty: t('form.empty'),
            alt: t('form.alt'),
          }}
        />
      </CardContent>
    </Card>
  );
}
