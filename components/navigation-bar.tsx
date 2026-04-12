'use client';

import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { formatAppHotkey } from '@/src/navigation/app-routes';
import { buildNavigationCategories } from '@/src/navigation/navigation-categories';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';
import { useTranslations } from '@/src/i18n';
import type { AppSession } from '@/src/auth';

import { AuthNavigation } from '@/components/auth-navigation';
import { GroupedNavigationMenu } from '@/components/grouped-navigation-menu';
import { LanguageSelector } from '@/components/language-selector';
import { NavigationHotkeys } from '@/components/navigation-hotkeys';
import { NotificationBell } from '@/components/notification-bell';
import { ProfileMenu } from '@/components/profile-menu';
import { ThemeToggle } from '@/components/theme-toggle';

type NavigationBarProps = {
  locale: AppLocale;
  session: AppSession | null;
  notificationCenter: NotificationPreview | null;
  siteName: string;
};

export function NavigationBar({ locale, session, notificationCenter, siteName }: NavigationBarProps) {
  const t = useTranslations('NavigationBar');
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
    })),
  }));

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {siteName || t('brand')}
        </Link>

        <GroupedNavigationMenu categories={navigationCategories} />

        <div className="flex flex-wrap items-center gap-2 md:justify-self-end">
          {session?.user?.id ? (
            <>
              <NotificationBell items={notificationCenter?.items ?? []} unreadCount={notificationCenter?.unreadCount ?? 0} />
              <ProfileMenu
                locale={locale}
                profileHref={`/profile/${session.user.id}`}
                settingsHref="/settings"
                imageUrl={session.user.image ?? null}
                displayName={session.user.name ?? 'User'}
                labels={{
                  profile: t('menu.profile'),
                  settings: t('menu.settings'),
                  logout: t('menu.logout'),
                  openMenu: t('menu.openMenu'),
                }}
              />
            </>
          ) : (
            <AuthNavigation
              labels={{
                login: t('auth.login'),
                register: t('auth.register'),
              }}
            />
          )}
          <NavigationHotkeys session={session} />
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
