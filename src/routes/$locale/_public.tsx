import { createFileRoute } from '@tanstack/react-router';

import { LocaleShell } from '@/components/locale-shell';
import type { AppLocale } from '@/i18n/routing';

export const Route = createFileRoute('/$locale/_public')({
  component: PublicLocaleLayout,
});

function PublicLocaleLayout() {
  const { locale, theme } = Route.useRouteContext();

  return (
    <LocaleShell
      locale={locale as AppLocale}
      theme={theme}
      session={null}
      notificationCenter={null}
    />
  );
}
