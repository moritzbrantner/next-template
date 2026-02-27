import { getTranslations } from 'next-intl/server';

import NextLink from 'next/link';

import { Link } from '@/i18n/navigation';

import { StorytellingExperience } from '@/components/storytelling-experience';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <div className="space-y-8">
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

      <StorytellingExperience
        scenes={[
          {
            id: 'arrival',
            title: 'Act I — Arrival',
            description:
              'The camera eases into the world as your audience enters the story space.',
            progressionStart: 0,
            progressionEnd: 30,
            color: '#4f46e5',
            position: [-2.4, -0.5, -1],
            scale: 0.9,
          },
          {
            id: 'conflict',
            title: 'Act II — Conflict',
            description:
              'Tension rises. Smooth, frame-by-frame transitions keep the narrative cinematic.',
            progressionStart: 30,
            progressionEnd: 75,
            color: '#f59e0b',
            position: [0.2, 0.4, 0],
            scale: 1.15,
          },
          {
            id: 'resolution',
            title: 'Act III — Resolution',
            description:
              'Everything settles into a calm finale while the progression reaches 100.',
            progressionStart: 75,
            progressionEnd: 100,
            color: '#10b981',
            position: [2.4, -0.3, -1.2],
            scale: 0.95,
          },
        ]}
      />
    </div>
  );
}
