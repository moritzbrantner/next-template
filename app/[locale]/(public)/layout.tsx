import { LocaleShell } from '@/components/locale-shell';
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
  const [siteConfig, announcements] = await Promise.all([getPublicSiteConfig(), getActiveAnnouncements(locale)]);

  return (
    <LocaleShell locale={locale} session={null} notificationCenter={null} siteName={siteConfig.siteName} announcements={announcements}>
      {children}
    </LocaleShell>
  );
}
