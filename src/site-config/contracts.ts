export const siteSettingKeys = [
  'site.name',
  'site.url',
  'seo.defaultTitle',
  'seo.titleSuffix',
  'seo.defaultDescription',
  'seo.defaultOgImage',
  'contact.supportEmail',
] as const;

export type SiteSettingKey = (typeof siteSettingKeys)[number];

export const featureFlagKeys = [
  'marketing.blog',
  'marketing.changelog',
  'marketing.announcements',
  'analytics.pageVisits',
] as const;

export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export type PublicSiteConfig = {
  siteName: string;
  siteUrl: string;
  seo: {
    defaultTitle: string;
    titleSuffix: string;
    defaultDescription: string;
    defaultOgImage: string | null;
  };
  contact: {
    supportEmail: string;
  };
  flags: Record<FeatureFlagKey, boolean>;
};
