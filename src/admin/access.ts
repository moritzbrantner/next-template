import { redirect } from '@tanstack/react-router';

import type { AppLocale } from '@/i18n/routing';
import { isAdmin } from '@/lib/authorization';
import type { AppSession } from '@/src/auth';

export function requireAdminPageAccess(session: AppSession | null, locale: AppLocale) {
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    throw redirect({
      to: '/$locale',
      params: { locale },
    });
  }
}
