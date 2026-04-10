import { createFileRoute } from '@tanstack/react-router';

import { LocaleShell } from '@/components/locale-shell';
import type { AppLocale } from '@/i18n/routing';
import {
  emptyAppContext,
  loadAppContext,
} from '@/src/runtime.functions';
import { isGithubPagesBuild } from '@/src/runtime/document-context';

export const Route = createFileRoute('/$locale/_app')({
  beforeLoad: async ({ location, cause }) => {
    if (isGithubPagesBuild) {
      return emptyAppContext;
    }

    return loadAppContext({
      data: {
        href: location.href,
        cause,
      },
    });
  },
  component: AppLocaleLayout,
});

function AppLocaleLayout() {
  const { locale, theme, session, notificationCenter } = Route.useRouteContext();

  return (
    <LocaleShell
      locale={locale as AppLocale}
      theme={theme}
      session={session}
      notificationCenter={notificationCenter}
    />
  );
}
