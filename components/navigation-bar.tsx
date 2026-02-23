import { getLocale, getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';

import { Link } from '@/i18n/navigation';
import { isAdmin } from '@/lib/authorization';

import { authOptions } from '@/src/auth';

import { ProfileMenu } from '@/components/profile-menu';
import { AuthNavigation } from '@/components/auth-navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

const baseNavLinks = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
] as const;

type NavigationBarProps = {
  locale: string;
};

export async function NavigationBar({ locale }: NavigationBarProps) {
  const t = await getTranslations('NavigationBar');
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  const navLinks = [
    ...baseNavLinks,
    ...(isAdmin(session?.user?.role) ? [{ href: '/admin', key: 'admin' as const }] : []),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t('brand')}
        </Link>

        <div className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
              })}
            >
              {t(`links.${link.key}`)}
            </Link>
          ))}
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
          ) : null}
          <AuthNavigation
            isAuthenticated={Boolean(session?.user)}
            locale={locale}
            user={session?.user}
            labels={{
              login: t('auth.login'),
              profile: t('auth.profile'),
              settings: t('auth.settings'),
              logout: t('auth.logout'),
              menu: t('auth.menu'),
            }}
          />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
