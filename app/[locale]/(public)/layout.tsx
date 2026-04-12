import { LocaleShell } from '@/components/locale-shell';
import { getConsentState } from '@/src/privacy/consent';
import { loadDocumentContext } from '@/src/runtime/document-context';
import { resolveLocale } from '@/src/server/page-guards';
import { getActiveAnnouncements, getPublicSiteConfig } from '@/src/site-config/service';

export default async function PublicLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { theme } = await loadDocumentContext();
  const [siteConfig, announcements, consent] = await Promise.all([
    getPublicSiteConfig(),
    getActiveAnnouncements(locale),
    getConsentState(),
  ]);

  return (
    <LocaleShell
      locale={locale}
      theme={theme}
      session={null}
      notificationCenter={null}
      siteName={siteConfig.siteName}
      announcements={announcements}
      consent={consent}
    >
      {children}
    </LocaleShell>
  );
}
