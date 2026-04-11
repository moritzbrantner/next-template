import type { Metadata } from 'next';

import { AppHydrationMarker } from '@/components/app-hydration-marker';
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
      data-app-hydrated="false"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
        <AppHydrationMarker />
        <AppSettingsProvider initialSettings={settings}>{children}</AppSettingsProvider>
      </body>
    </html>
  );
}
