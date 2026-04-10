import type { Metadata } from 'next';

import { AppSettingsProvider } from '@/src/settings/provider';
import { loadDocumentContext, settingsScript, themeScript } from '@/src/runtime/document-context';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next Template',
  description: 'Next.js application with auth, admin examples, and Drizzle/Postgres persistence.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme, settings } = await loadDocumentContext();

  return (
    <html
      lang="en"
      className={theme}
      data-background={settings.background}
      data-density={settings.compactSpacing ? 'compact' : 'comfortable'}
      data-motion={settings.reducedMotion ? 'reduced' : 'full'}
      data-hotkey-hints={settings.showHotkeyHints ? 'visible' : 'hidden'}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
        <AppSettingsProvider initialSettings={settings}>{children}</AppSettingsProvider>
      </body>
    </html>
  );
}
