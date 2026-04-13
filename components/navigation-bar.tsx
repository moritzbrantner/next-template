import { Suspense } from 'react';

import { LocalizedLink } from '@/i18n/server-link';
import type { AppLocale } from '@/i18n/routing';
import type { AppSession } from '@/src/auth';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';
import { formatAppHotkey } from '@/src/navigation/app-routes';
import { buildNavigationCategories } from '@/src/navigation/navigation-categories';
import { createTranslator } from '@/src/i18n/messages';
import { loadAppContext } from '@/src/runtime.functions';
import { buildPublicProfilePath } from '@/src/profile/tags';

import { AuthNavigation } from '@/components/auth-navigation';
import { GroupedNavigationMenu } from '@/components/grouped-navigation-menu';
import { NavigationHotkeysTrigger } from '@/components/navigation-hotkeys-trigger';
import { NavigationPreferences } from '@/components/navigation-preferences';
import { NotificationBell } from '@/components/notification-bell';
import { ProfileMenu } from '@/components/profile-menu';

type NavigationBarProps = {
  locale: AppLocale;
  siteName: string;
  session?: AppSession | null;
  notificationCenter?: NotificationPreview | null;
};

export function NavigationBar({ locale, siteName, session, notificationCenter }: NavigationBarProps) {
  const t = createTranslator(locale, 'NavigationBar');
  const guestNavigationCategories = buildNavigationCategories({
    isAuthenticated: false,
    role: null,
  }).map((category) => ({
    key: category.key,
    label: t(`categories.${category.key}`),
    links: category.links.map((link) => ({
      href: link.href,
      label: t(link.translationKey),
      hotkey: formatAppHotkey(link.hotkey),
      prefetch: link.prefetch,
    })),
  }));
  const authLabels = {
    login: t('auth.login'),
    register: t('auth.register'),
  };
  const profileLabels = {
    profile: t('menu.profile'),
    settings: t('menu.settings'),
    logout: t('menu.logout'),
    openMenu: t('menu.openMenu'),
  };

  return (
    <header className="sticky top-0 z-10 overflow-visible border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95">
      <nav className="mx-auto grid w-full max-w-5xl gap-3 overflow-visible px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <LocalizedLink href="/" locale={locale} className="text-lg font-semibold tracking-tight">
          {siteName || t('brand')}
        </LocalizedLink>

        {session !== undefined || notificationCenter !== undefined ? (
          <NavigationBarContent
            locale={locale}
            navigationCategories={buildNavigationCategories({
              isAuthenticated: Boolean(session?.user?.id),
              role: session?.user?.role,
            }).map((category) => ({
              key: category.key,
              label: t(`categories.${category.key}`),
              links: category.links.map((link) => ({
                href: link.href,
                label: t(link.translationKey),
                hotkey: formatAppHotkey(link.hotkey),
                prefetch: link.prefetch,
              })),
            }))}
            authLabels={authLabels}
            profileLabels={profileLabels}
            session={session ?? null}
            notificationCenter={notificationCenter ?? null}
          />
        ) : (
          <Suspense
            fallback={
              <NavigationBarContent
                locale={locale}
                navigationCategories={guestNavigationCategories}
                authLabels={authLabels}
                profileLabels={profileLabels}
                session={null}
                notificationCenter={null}
              />
            }
          >
            <NavigationBarResolved locale={locale} authLabels={authLabels} profileLabels={profileLabels} />
          </Suspense>
        )}
      </nav>
    </header>
  );
}

async function NavigationBarResolved({
  locale,
  authLabels,
  profileLabels,
}: {
  locale: AppLocale;
  authLabels: {
    login: string;
    register: string;
  };
  profileLabels: {
    profile: string;
    settings: string;
    logout: string;
    openMenu: string;
  };
}) {
  const { session, notificationCenter } = await loadAppContext();
  const t = createTranslator(locale, 'NavigationBar');
  const navigationCategories = buildNavigationCategories({
    isAuthenticated: Boolean(session?.user?.id),
    role: session?.user?.role,
  }).map((category) => ({
    key: category.key,
    label: t(`categories.${category.key}`),
    links: category.links.map((link) => ({
      href: link.href,
      label: t(link.translationKey),
      hotkey: formatAppHotkey(link.hotkey),
      prefetch: link.prefetch,
    })),
  }));

  return (
    <NavigationBarContent
      locale={locale}
      navigationCategories={navigationCategories}
      authLabels={authLabels}
      profileLabels={profileLabels}
      session={session}
      notificationCenter={notificationCenter}
    />
  );
}

function NavigationBarContent({
  locale,
  navigationCategories,
  authLabels,
  profileLabels,
  session,
  notificationCenter,
}: {
  locale: AppLocale;
  navigationCategories: Array<{
    key: 'discover' | 'workspace' | 'admin';
    label: string;
    links: Array<{
      href: string;
      label: string;
      hotkey: string;
      prefetch?: boolean;
    }>;
  }>;
  authLabels: {
    login: string;
    register: string;
  };
  profileLabels: {
    profile: string;
    settings: string;
    logout: string;
    openMenu: string;
  };
  session: AppSession | null;
  notificationCenter: NotificationPreview | null;
}) {
  return (
    <>
      <GroupedNavigationMenu categories={navigationCategories} />

      <div className="flex flex-wrap items-center gap-2 md:justify-self-end">
        {session?.user?.id ? (
          <>
            <NotificationBell items={notificationCenter?.items ?? []} unreadCount={notificationCenter?.unreadCount ?? 0} />
            <ProfileMenu
              locale={locale}
              profileHref={session.user.tag ? buildPublicProfilePath(session.user.tag) : '/profile'}
              settingsHref="/settings"
              imageUrl={session.user.image ?? null}
              displayName={session.user.name ?? 'User'}
              labels={profileLabels}
            />
          </>
        ) : (
          <AuthNavigation locale={locale} labels={authLabels} />
        )}
        <NavigationHotkeysTrigger session={session} />
        <NavigationPreferences />
      </div>
    </>
  );
}
