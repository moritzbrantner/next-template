import { useEffect } from 'react';

import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
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
  const { locale } = Route.useRouteContext();

  return (
    <I18nProvider locale={locale as AppLocale}>
      <DocumentLanguage locale={locale as AppLocale} />
      <Outlet />
    </I18nProvider>
  );
}

function DocumentLanguage({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
