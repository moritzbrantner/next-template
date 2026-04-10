/// <reference types="vite/client" />

import { useEffect } from 'react';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';

import { RouterDevtools } from '@/components/router-devtools';
import { AppSettingsProvider } from '@/src/settings/provider';
import {
  loadDocumentContext,
  loadStaticDocumentContext,
  isGithubPagesBuild,
  settingsScript,
  themeScript,
  type DocumentRouteContext,
} from '@/src/runtime/document-context';
import appCss from '@/src/styles/app.css?url';

export const Route = createRootRouteWithContext<DocumentRouteContext>()({
  beforeLoad: async () => {
    if (isGithubPagesBuild) {
      return loadStaticDocumentContext();
    }

    return loadDocumentContext();
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Platform App',
      },
      {
        name: 'description',
        content: 'A TanStack Start platform application template.',
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
          <RouterDevtools />
          <Scripts />
        </AppSettingsProvider>
      </body>
    </html>
  );
}
