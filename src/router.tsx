import type { Theme } from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';
import { normalizeRouterBasePath } from '@/src/runtime/base-path';
import { defaultAppSettings, type AppSettings } from '@/src/settings/preferences';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    basepath: normalizeRouterBasePath(import.meta.env.BASE_URL),
    context: {
      session: null as AppSession | null,
      notificationCenter: null as NotificationPreview | null,
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
