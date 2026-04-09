import { createFileRoute, redirect } from '@tanstack/react-router';

import { routing } from '@/i18n/routing';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$locale',
      params: { locale: routing.defaultLocale },
      replace: true,
    });
  },
});
