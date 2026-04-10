import { LocaleShell } from '@/components/locale-shell';
import { loadDocumentContext } from '@/src/runtime/document-context';
import { resolveLocale } from '@/src/server/page-guards';

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

  return (
    <LocaleShell locale={locale} theme={theme} session={null} notificationCenter={null}>
      {children}
    </LocaleShell>
  );
}
