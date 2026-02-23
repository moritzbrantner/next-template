import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/src/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ProfileImageForm } from './profile-image-form';

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('ProfilePage');

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
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
          }}
        />
      </CardContent>
    </Card>
  );
}
