import { useEffect } from 'react';

import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { NavigationBar } from '@/components/navigation-bar';
import { hasLocale, routing, type AppLocale } from '@/i18n/routing';
import { I18nProvider } from '@/src/i18n';

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!hasLocale(params.locale)) {
      throw redirect({
        to: '/$locale',
        params: { locale: routing.defaultLocale },
      });
    }

    return {
      locale: params.locale,
    };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale, session, notificationCenter, theme } = Route.useRouteContext();

  return (
    <I18nProvider locale={locale as AppLocale}>
      <DocumentLanguage locale={locale as AppLocale} />
      <NavigationBar
        initialTheme={theme}
        locale={locale as AppLocale}
        session={session}
        notificationCenter={notificationCenter}
      />
      <main className="app-shell mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </I18nProvider>
  );
}

function DocumentLanguage({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
