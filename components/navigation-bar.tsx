import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

import { Link } from '@/i18n/navigation';
import { isAdmin } from '@/lib/authorization';
import { THEME_COOKIE_NAME, isTheme } from '@/lib/theme';
import { buildNavigationCategories } from '@/src/navigation/navigation-categories';

import { authOptions } from '@/src/auth';

import { ProfileMenu } from '@/components/profile-menu';
import { AuthNavigation } from '@/components/auth-navigation';
import { GroupedNavigationMenu } from '@/components/grouped-navigation-menu';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';

type NavigationBarProps = {
  locale: string;
};

export async function NavigationBar({ locale }: NavigationBarProps) {
  const t = await getTranslations('NavigationBar');
  const session = await getServerSession(authOptions);
  const themeCookie = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  const initialTheme = isTheme(themeCookie) ? themeCookie : 'light';
  const navigationCategories = buildNavigationCategories({
    isAuthenticated: Boolean(session?.user?.id),
    isAdmin: isAdmin(session?.user?.role),
  }).map((category) => ({
    key: category.key,
    label: t(`categories.${category.key}`),
    links: category.links.map((link) => ({
      href: link.href,
      label: t(`links.${link.key}`),
    })),
  }));

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t('brand')}
        </Link>

        <GroupedNavigationMenu categories={navigationCategories} />

        <div className="flex flex-wrap items-center gap-2 md:justify-self-end">
          {session?.user?.id ? (
            <ProfileMenu
              locale={locale}
              profileHref="/profile"
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
          ) : (
            <AuthNavigation
              labels={{
                login: t('auth.login'),
                register: t('auth.register'),
              }}
            />
          )}
          <LanguageSelector />
          <ThemeToggle initialTheme={initialTheme} />
        </div>
      </nav>
    </header>
  );
}
