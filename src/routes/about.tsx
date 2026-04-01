import { createFileRoute, redirect } from '@tanstack/react-router';

import { routing } from '@/i18n/routing';

export const Route = createFileRoute('/about')({
  beforeLoad: () => {
    throw redirect({
      to: '/$locale/about',
      params: { locale: routing.defaultLocale },
    });
  },
});
