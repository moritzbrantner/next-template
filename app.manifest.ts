export const appManifest = {
  appId: 'web',
  slug: 'web',
  displayName: 'Web',
  platform: 'web',
  packageName: 'web',
  entryWorkspace: 'apps/web',
  releaseCadence: 'independent',
  sharedPackages: ['@repo/upload-playbook'],
  featureFlags: ['tabs', 'profiles', 'uploads'],
  deployment: {
    runtime: 'tanstack-start',
    scheme: 'web',
  },
} as const;
