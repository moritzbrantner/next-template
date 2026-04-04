/// <reference types="vite/client" />

import { useEffect } from 'react';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import type { Theme } from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import { loadAppContext } from '@/src/runtime.functions';
import { AppSettingsProvider } from '@/src/settings/provider';
import { defaultAppSettings, type AppSettings } from '@/src/settings/preferences';
import appCss from '@/src/styles/app.css?url';

type RouterContext = {
  session: AppSession | null;
  theme: Theme;
  settings: AppSettings;
};

const themeScript = `
(() => {
  const cookieTheme = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('theme='))
    ?.split('=')[1];
  const storedTheme = window.localStorage.getItem('theme');
  const theme = cookieTheme === 'light' || cookieTheme === 'dark'
    ? cookieTheme
    : (storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
})();
`;

const settingsScript = `
(() => {
  const defaultSettings = ${JSON.stringify(defaultAppSettings)};
  const parseSettings = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  };
  const cookieSettings = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('app-settings='))
    ?.split('=')[1];
  const storedSettings = window.localStorage.getItem('app-settings');
  const settings = { ...defaultSettings, ...(parseSettings(cookieSettings) ?? parseSettings(storedSettings) ?? {}) };

  document.documentElement.dataset.background = settings.background;
  document.documentElement.dataset.density = settings.compactSpacing ? 'compact' : 'comfortable';
  document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  document.documentElement.dataset.hotkeyHints = settings.showHotkeyHints ? 'visible' : 'hidden';
})();
`;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    return loadAppContext();
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Next Template',
      },
      {
        name: 'description',
        content: 'A simple TanStack Start template with localized routing.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { theme, settings } = Route.useRouteContext();

  useEffect(() => {
    document.documentElement.dataset.appHydrated = 'true';
  }, []);

  return (
    <html
      lang="en"
      className={theme}
      data-background={settings.background}
      data-density={settings.compactSpacing ? 'compact' : 'comfortable'}
      data-motion={settings.reducedMotion ? 'reduced' : 'full'}
      data-hotkey-hints={settings.showHotkeyHints ? 'visible' : 'hidden'}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
        <AppSettingsProvider initialSettings={settings}>
          <Outlet />
          <TanStackRouterDevtools position="bottom-right" />
          <Scripts />
        </AppSettingsProvider>
      </body>
    </html>
  );
}
