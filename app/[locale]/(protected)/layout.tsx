import { LocaleShell } from '@/components/locale-shell';
import { getConsentState } from '@/src/privacy/consent';
import { loadDocumentContext } from '@/src/runtime/document-context';
import { loadAppContext } from '@/src/runtime.functions';
import { redirectToLocaleHome, resolveLocale } from '@/src/server/page-guards';
import { getActiveAnnouncements, getPublicSiteConfig } from '@/src/site-config/service';

export default async function ProtectedLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { theme } = await loadDocumentContext();
  const [appContext, siteConfig, announcements, consent] = await Promise.all([
    loadAppContext(),
    getPublicSiteConfig(),
    getActiveAnnouncements(locale),
    getConsentState(),
  ]);

  if (!appContext.session?.user?.id) {
    redirectToLocaleHome(locale);
  }

  return (
    <LocaleShell
      locale={locale}
      theme={theme}
      session={appContext.session}
      notificationCenter={appContext.notificationCenter}
      siteName={siteConfig.siteName}
      announcements={announcements}
      consent={consent}
    >
      {children}
    </LocaleShell>
  );
}
