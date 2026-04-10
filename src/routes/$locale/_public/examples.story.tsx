import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/_public/examples/story')({
  component: StoryPage,
});

function StoryPage() {
  const t = useTranslations('StoryPage');

  return (
    <div className="space-y-8">
      <Card className="mx-auto max-w-3xl rounded-3xl">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('note')}</p>
        </CardContent>
      </Card>

      {/* <ThreeShowcase /> */}

      {/* <StorytellingExperience scenes={storyScenes} /> */}
    </div>
  );
}
