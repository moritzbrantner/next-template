import { LanguageSelector } from '@/components/language-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { LocalizedLink } from '@/i18n/server-link';
import type { AppLocale } from '@/i18n/routing';
import { formatAppHotkey } from '@/src/navigation/app-routes';
import { buildNavigationCategories } from '@/src/navigation/navigation-categories';
import { createTranslator } from '@/src/i18n/messages';

type PublicNavigationBarProps = {
  locale: AppLocale;
  siteName: string;
};

export function PublicNavigationBar({ locale, siteName }: PublicNavigationBarProps) {
  const t = createTranslator(locale, 'NavigationBar');
  const categories = buildNavigationCategories({
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

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <LocalizedLink href="/" locale={locale} className="text-lg font-semibold tracking-tight">
          {siteName || t('brand')}
        </LocalizedLink>

        <div className="relative min-w-0">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:justify-center">
            {categories.map((category) => (
              <details key={category.key} className="group relative shrink-0">
                <summary className="list-none rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-zinc-50 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    {category.label}
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform group-open:rotate-180">
                      <path
                        d="M4.25 6.5 8 10.25 11.75 6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </span>
                </summary>

                <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 hidden min-w-[18rem] rounded-[1.75rem] border border-zinc-200/80 bg-white/95 p-3 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl group-open:block dark:border-zinc-800 dark:bg-zinc-950/95">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {category.links.map((link) => (
                      <li key={link.href}>
                        <LocalizedLink
                          href={link.href}
                          locale={locale}
                          prefetch={link.prefetch}
                          className="flex min-h-16 items-center rounded-2xl bg-zinc-50/90 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                        >
                          <span>{link.label}</span>
                          <span
                            aria-hidden="true"
                            className="ml-auto rounded-full border border-zinc-200/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                          >
                            {link.hotkey}
                          </span>
                        </LocalizedLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-self-end">
          <LocalizedLink href="/login" locale={locale} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {t('auth.login')}
          </LocalizedLink>
          <LocalizedLink href="/register" locale={locale} className={buttonVariants({ size: 'sm' })}>
            {t('auth.register')}
          </LocalizedLink>
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
