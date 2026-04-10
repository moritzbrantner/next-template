import { createFileRoute } from '@tanstack/react-router';

import { useTranslations } from '@/src/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/$locale/_public/about')({
  component: AboutPage,
});

function AboutPage() {
  const t = useTranslations('AboutPage');

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
        <p>{t('paragraphOne')}</p>
        <p>{t('paragraphTwo')}</p>
      </CardContent>
    </Card>
  );
}
