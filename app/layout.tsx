import type { Metadata } from 'next';

import { AppHydrationMarker } from '@/components/app-hydration-marker';
import { AppSettingsProvider } from '@/src/settings/provider';
import { settingsScript, themeScript } from '@/src/runtime/document-context';
import { defaultAppSettings } from '@/src/settings/preferences';
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

import Script from 'next/script';

// ...your other imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Script id="settings-script" strategy="beforeInteractive">
          {settingsScript}
        </Script>

        <AppHydrationMarker />
        <AppSettingsProvider initialSettings={defaultAppSettings}>
          {children}
        </AppSettingsProvider>
      </body>
    </html>
  );
}
