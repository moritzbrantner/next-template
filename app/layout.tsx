import type { Metadata } from 'next';

import { AppHydrationMarker } from '@/components/app-hydration-marker';
import { AppSettingsProvider } from '@/src/settings/provider';
import { loadDocumentContext, settingsScript, themeScript } from '@/src/runtime/document-context';
import { getPublicSiteConfig } from '@/src/site-config/service';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getPublicSiteConfig();

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: siteConfig.seo.defaultTitle,
      template: `%s${siteConfig.seo.titleSuffix}`,
    },
    description: siteConfig.seo.defaultDescription,
    openGraph: {
      title: siteConfig.seo.defaultTitle,
      description: siteConfig.seo.defaultDescription,
      images: siteConfig.seo.defaultOgImage ? [siteConfig.seo.defaultOgImage] : undefined,
    },
  };
}

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
