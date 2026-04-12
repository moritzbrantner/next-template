import { LocaleShell } from '@/components/locale-shell';
import { loadAppContext } from '@/src/runtime.functions';
import { redirectToLocaleHome, resolveLocale } from '@/src/server/page-guards';
import { isAdmin } from '@/lib/authorization';
import { getActiveAnnouncements, getPublicSiteConfig } from '@/src/site-config/service';

export default async function AdminLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const [appContext, siteConfig, announcements] = await Promise.all([
    loadAppContext(),
    getPublicSiteConfig(),
    getActiveAnnouncements(locale),
  ]);

  if (!appContext.session?.user?.id || !isAdmin(appContext.session.user.role)) {
    redirectToLocaleHome(locale);
  }

  return (
    <LocaleShell
      locale={locale}
      session={appContext.session}
      notificationCenter={appContext.notificationCenter}
      siteName={siteConfig.siteName}
      announcements={announcements}
    >
      {children}
    </LocaleShell>
  );
}
