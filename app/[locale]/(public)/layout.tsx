import { LocaleShell } from '@/components/locale-shell';
import { loadAppContext } from '@/src/runtime.functions';
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

  const [{ session, notificationCenter }, siteConfig, announcements] = await Promise.all([
    loadAppContext(),
    getPublicSiteConfig(),
    getActiveAnnouncements(locale),
  ]);

  return (
    <LocaleShell
      locale={locale}
      session={session}
      notificationCenter={notificationCenter}
      siteName={siteConfig.siteName}
      announcements={announcements}
    >
      {children}
    </LocaleShell>
  );
}