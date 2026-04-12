import type { ReactNode } from 'react';

import { NavigationBar } from '@/components/navigation-bar';
import { ConsentBanner } from '@/components/privacy/consent-banner';
import { SiteAnnouncementBanner } from '@/components/site-announcement-banner';
import type { AppLocale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';
import type { ConsentState } from '@/src/privacy/consent';

type LocaleShellProps = {
  children: ReactNode;
  locale: AppLocale;
  theme: Theme;
  session: AppSession | null;
  notificationCenter: NotificationPreview | null;
  siteName: string;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    href: string | null;
  }>;
  consent: {
    hasExplicitChoice: boolean;
    state: ConsentState;
  };
};

export function LocaleShell({ children, locale, theme, session, notificationCenter, siteName, announcements, consent }: LocaleShellProps) {
  return (
    <>
      <NavigationBar
        initialTheme={theme}
        locale={locale}
        session={session}
        notificationCenter={notificationCenter}
        siteName={siteName}
      />
      <main className="app-shell mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl px-4 py-10">
        <div className="space-y-4">
          {!consent.hasExplicitChoice ? <ConsentBanner initialConsent={consent.state} visible /> : null}
          {announcements.map((announcement) => (
            <SiteAnnouncementBanner key={announcement.id} announcement={announcement} />
          ))}
        </div>
        {children}
      </main>
    </>
  );
}
