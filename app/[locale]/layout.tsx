import { routing } from '@/i18n/routing';
import { I18nProvider } from '@/src/i18n';
import { getMessages } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

import { DocumentLanguage } from './document-language';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <DocumentLanguage locale={locale} />
      {children}
    </I18nProvider>
  );
}
