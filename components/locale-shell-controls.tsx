'use client';

import {
  AccountMenu,
  Button,
  defaultLanguageSwitcherLanguages,
  LanguageSwitcher,
  NotificationMenu,
  ThemeModeSwitch,
} from '@moritzbrantner/ui';
import { useSyncExternalStore } from 'react';

import { NavigationHotkeysTrigger } from '@/components/navigation-hotkeys-trigger';
import { dispatchAllNotificationsMarkedRead } from '@/components/notifications/events';
import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, routing } from '@/i18n/routing';
import {
  isTheme,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme';
import type { AppSession } from '@/src/auth';
import type { NotificationPreview } from '@/src/domain/notifications/use-cases';

type NavigationHotkey = readonly [string, string];

type NavigationHotkeyItem = {
  key: string;
  href: string;
  label: string;
  groupLabel: string;
  hotkey: NavigationHotkey;
  hotkeyLabel: string;
  searchText: string;
};

type LocaleShellControlsProps = {
  locale: AppLocale;
  session: AppSession | null;
  notificationCenter: NotificationPreview | null;
  profileHref: string;
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
  notificationLabels: {
    title: string;
    empty: string;
    markAllRead: string;
  };
  languageLabels: {
    label: string;
  };
  themeLabels: {
    label: string;
    light: string;
    dark: string;
  };
  hotkeyItems: NavigationHotkeyItem[];
  hotkeyLabels: {
    button: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    empty: string;
  };
};

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : getSystemTheme();
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onThemeChange = () => onStoreChange();

  window.addEventListener('storage', onThemeChange);
  window.addEventListener('themechange', onThemeChange);

  return () => {
    window.removeEventListener('storage', onThemeChange);
    window.removeEventListener('themechange', onThemeChange);
  };
}

function persistTheme(theme: Theme) {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event('themechange'));
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function LocaleShellControls({
  locale,
  session,
  notificationCenter,
  profileHref,
  authLabels,
  profileLabels,
  notificationLabels,
  languageLabels,
  themeLabels,
  hotkeyItems,
  hotkeyLabels,
}: LocaleShellControlsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    getThemeSnapshot,
    () => 'light',
  );
  const languages = defaultLanguageSwitcherLanguages.filter((language) =>
    routing.locales.includes(language.value as AppLocale),
  );

  async function markAllNotificationsRead() {
    const response = await fetch('/api/notifications/read', {
      method: 'POST',
    });

    if (!response.ok) {
      return;
    }

    dispatchAllNotificationsMarkedRead();
    router.refresh();
  }

  return (
    <>
      {session?.user?.id ? (
        <>
          <NotificationMenu
            label={notificationLabels.title}
            unreadCount={notificationCenter?.unreadCount ?? 0}
            emptyLabel={notificationLabels.empty}
            markAllReadLabel={notificationLabels.markAllRead}
            onMarkAllRead={
              (notificationCenter?.unreadCount ?? 0) > 0
                ? markAllNotificationsRead
                : undefined
            }
            items={(notificationCenter?.items ?? []).map((item) => {
              const href = item.href;

              return {
                id: item.id,
                title: item.title,
                description: item.body,
                unread: item.status === 'unread',
                meta: formatNotificationDate(item.createdAt),
                onSelect: href ? () => router.push(href) : undefined,
              };
            })}
            maxItems={5}
          />
          <AccountMenu
            label={profileLabels.openMenu}
            user={{
              name: session.user.name ?? 'User',
              email: session.user.email ?? undefined,
              imageUrl: session.user.image,
            }}
            items={[
              {
                id: 'profile',
                label: profileLabels.profile,
                onSelect: () => router.push(profileHref),
              },
              {
                id: 'settings',
                label: profileLabels.settings,
                onSelect: () => router.push('/settings'),
              },
              {
                id: 'logout',
                label: profileLabels.logout,
                destructive: true,
                onSelect: () => {
                  void fetch('/api/auth/logout', {
                    method: 'POST',
                  }).then(() => {
                    router.push('/', locale);
                    router.refresh();
                  });
                },
              },
            ]}
          />
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <a href={`/${locale}/login`}>{authLabels.login}</a>
          </Button>
          <Button asChild size="sm">
            <a href={`/${locale}/register`}>{authLabels.register}</a>
          </Button>
        </>
      )}
      <NavigationHotkeysTrigger items={hotkeyItems} labels={hotkeyLabels} />
      <LanguageSwitcher
        aria-label={languageLabels.label}
        languages={languages}
        value={locale}
        onValueChange={(nextLocale) => {
          router.push(pathname, nextLocale as AppLocale);
        }}
      />
      <ThemeModeSwitch
        aria-label={themeLabels.label}
        mode={theme}
        lightLabel={themeLabels.light}
        darkLabel={themeLabels.dark}
        onModeChange={persistTheme}
      />
    </>
  );
}
