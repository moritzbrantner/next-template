import { LocaleShell } from '@/components/locale-shell';
import { loadDocumentContext } from '@/src/runtime/document-context';
import { loadAppContext } from '@/src/runtime.functions';
import { resolveLocale } from '@/src/server/page-guards';

export default async function GuestLocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { theme } = await loadDocumentContext();
  const { session, notificationCenter } = await loadAppContext();

  return (
    <LocaleShell locale={locale} theme={theme} session={session} notificationCenter={notificationCenter}>
      {children}
    </LocaleShell>
  );
}
