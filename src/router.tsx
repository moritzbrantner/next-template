import type { Theme } from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import { defaultAppSettings, type AppSettings } from '@/src/settings/preferences';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    context: {
      session: null as AppSession | null,
      theme: 'light' as Theme,
      settings: defaultAppSettings as AppSettings,
    },
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
