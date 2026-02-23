import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
] as const;

export async function NavigationBar() {
  const t = await getTranslations('NavigationBar');

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
