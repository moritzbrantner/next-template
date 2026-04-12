import type { MetadataRoute } from 'next';

import { getPublicSiteConfig } from '@/src/site-config/service';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteConfig = await getPublicSiteConfig();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
