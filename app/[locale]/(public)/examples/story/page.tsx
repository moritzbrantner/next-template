import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'StoryPage');

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
    </div>
  );
}
