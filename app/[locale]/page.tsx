import { getTranslations } from 'next-intl/server';

import NextLink from 'next/link';

import { Link } from '@/i18n/navigation';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Link href="/about" className={buttonVariants({ variant: 'default' })}>
          {t('visitAbout')}
        </Link>
        <NextLink href="https://nextjs.org/docs" className={buttonVariants({ variant: 'ghost' })}>
          {t('docs')}
        </NextLink>
      </CardContent>
    </Card>
  );
}
