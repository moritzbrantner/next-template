import { LocaleShell } from '@/components/locale-shell';
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

  return (
    <LocaleShell locale={locale} siteName={siteConfig.siteName}>
      {children}
    </LocaleShell>
  );
}
