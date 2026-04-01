import { createFileRoute, redirect } from '@tanstack/react-router';

import { ProfileImageForm } from '@/components/profile-image-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/settings')({
  beforeLoad: ({ context, params }) => {
    if (!context.session?.user?.id) {
      throw redirect({
        to: '/$locale',
        params: { locale: params.locale },
      });
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const { session } = Route.useRouteContext();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold">{t('profilePictureTitle')}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('profilePictureDescription')}</p>
        </div>

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
