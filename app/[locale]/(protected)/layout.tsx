import { LocaleShell } from '@/components/locale-shell';
import { loadDocumentContext } from '@/src/runtime/document-context';
import { loadAppContext } from '@/src/runtime.functions';
import { redirectToLocaleHome, resolveLocale } from '@/src/server/page-guards';

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
  const appContext = await loadAppContext();

  if (!appContext.session?.user?.id) {
    redirectToLocaleHome(locale);
  }

  return (
    <LocaleShell
      locale={locale}
      theme={theme}
      session={appContext.session}
      notificationCenter={appContext.notificationCenter}
    >
      {children}
    </LocaleShell>
  );
}
