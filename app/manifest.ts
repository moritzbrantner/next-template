import type { MetadataRoute } from 'next';

import { getPublicSiteConfig } from '@/src/site-config/service';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteConfig = await getPublicSiteConfig();

  return {
    name: siteConfig.siteName,
    short_name: siteConfig.siteName,
    description: siteConfig.seo.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
  };
}
