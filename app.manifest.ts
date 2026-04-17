export const appManifest = {
  appId: 'web',
  slug: 'web',
  displayName: 'Web',
  platform: 'web',
  packageName: 'next-template',
  entryWorkspace: '.',
  releaseCadence: 'independent',
  sharedPackages: ['@moritzbrantner/ui', '@moritzbrantner/storytelling'],
  featureFlags: ['auth', 'admin', 'uploads', 'storytelling', 'app-pack'],
  deployment: {
    runtime: 'nextjs',
    output: '.next',
  },
} as const;
