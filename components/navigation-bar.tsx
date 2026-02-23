import { getTranslations } from 'next-intl/server';
import { getServerSession } from 'next-auth';

import { Link } from '@/i18n/navigation';
import { isAdmin } from '@/lib/authorization';
import { authOptions } from '@/src/auth';

import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

const baseNavLinks = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
] as const;

export async function NavigationBar() {
  const t = await getTranslations('NavigationBar');
  const session = await getServerSession(authOptions);
  const navLinks = [
    ...baseNavLinks,
    ...(session?.user?.id ? [{ href: '/profile', key: 'profile' as const }] : []),
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
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
