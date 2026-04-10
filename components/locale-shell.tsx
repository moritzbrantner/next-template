import type { ReactNode } from 'react';

import { NavigationBar } from '@/components/navigation-bar';
import type { AppLocale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';

type LocaleShellProps = {
  children: ReactNode;
  locale: AppLocale;
  theme: Theme;
  session: AppSession | null;
  notificationCenter: NotificationPreview | null;
};

export function LocaleShell({ children, locale, theme, session, notificationCenter }: LocaleShellProps) {
  return (
    <>
      <NavigationBar
        initialTheme={theme}
        locale={locale}
        session={session}
        notificationCenter={notificationCenter}
      />
      <main className="app-shell mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl px-4 py-10">
        {children}
      </main>
    </>
  );
}
