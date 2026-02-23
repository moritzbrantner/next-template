import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';

import { Link } from '@/i18n/navigation';
import { authOptions } from '@/src/auth';

import { AuthNavigation } from '@/components/auth-navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
] as const;

type NavigationBarProps = {
  locale: string;
};

export async function NavigationBar({ locale }: NavigationBarProps) {
  const t = await getTranslations('NavigationBar');
  const session = await getServerSession(authOptions);

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
