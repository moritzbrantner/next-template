import { UploadPlayground } from '@/components/uploads/upload-playground';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function UploadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const t = createTranslator(locale, 'UploadsPage');

  return (
    <div className="space-y-8">
      <Card className="mx-auto max-w-4xl rounded-3xl">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            {t('eyebrow')}
          </p>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
      </Card>

      <UploadPlayground
        copy={{
          heroTitle: t('heroTitle'),
          heroDescription: t('heroDescription'),
          queueTitle: t('queueTitle'),
          queueDescription: t('queueDescription'),
          empty: t('empty'),
          clearQueue: t('clearQueue'),
          chooseFiles: t('chooseFiles'),
          acceptedTitle: t('acceptedTitle'),
          lifecycleTitle: t('lifecycleTitle'),
        }}
      />
    </div>
  );
}
