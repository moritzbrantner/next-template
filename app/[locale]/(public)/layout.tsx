import { LocaleShell } from '@/components/locale-shell';
import { I18nProvider } from '@/src/i18n';
import { getMessages } from '@/src/i18n/messages';
import { publicWebsiteNamespaces } from '@/src/i18n/namespaces';
import { resolveLocale } from '@/src/server/page-guards';
import { getPublicSiteConfig } from '@/src/site-config/service';

export default async function PublicLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const siteConfig = await getPublicSiteConfig();
  const messages = getMessages(locale, publicWebsiteNamespaces);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <LocaleShell locale={locale} siteName={siteConfig.siteName}>
        {children}
      </LocaleShell>
    </I18nProvider>
  );
}
