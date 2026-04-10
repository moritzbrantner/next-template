import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'AboutPage');

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
