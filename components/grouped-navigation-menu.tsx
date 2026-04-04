'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';

import { Link, usePathname } from '@/i18n/navigation';
import { type NavigationCategoryKey } from '@/src/navigation/navigation-categories';
import { useAppSettings } from '@/src/settings/provider';

type GroupedNavigationMenuProps = {
  categories: Array<{
    key: NavigationCategoryKey;
    label: string;
    links: Array<{
      href: string;
      label: string;
      hotkey: string;
    }>;
  }>;
};

function matchesPath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GroupedNavigationMenu({ categories }: GroupedNavigationMenuProps) {
  const pathname = usePathname();
  const { settings } = useAppSettings();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openState, setOpenState] = useState<{
    key: NavigationCategoryKey;
    pathname: string;
  } | null>(null);

  const activeCategoryKey =
    categories.find((category) => category.links.some((link) => matchesPath(pathname, link.href)))?.key ?? null;
  const openCategoryKey =
    openState &&
    openState.pathname === pathname &&
    categories.some((category) => category.key === openState.key)
      ? openState.key
      : null;
  const openCategory = categories.find((category) => category.key === openCategoryKey) ?? null;

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      setOpenState(null);
    }
  });

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpenState(null);
    }
  });

  useEffect(() => {
    if (!openCategoryKey) {
      return;
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openCategoryKey]);

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 340, damping: 30, mass: 0.8 };

  const itemVariants = prefersReducedMotion
    ? {
        closed: { opacity: 1 },
        open: { opacity: 1 },
      }
    : {
        closed: { opacity: 0, y: -6 },
        open: { opacity: 1, y: 0 },
      };

  return (
    <div
      ref={containerRef}
      className="relative min-w-0"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpenState(null);
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:justify-center">
        <LayoutGroup id="navigation-menu">
          {categories.map((category) => {
            const isOpen = category.key === openCategoryKey;
            const isActive = category.key === activeCategoryKey;

            return (
              <div key={category.key} className="shrink-0">
                <button
                  type="button"
                  aria-controls={`navigation-submenu-${category.key}`}
                  aria-expanded={isOpen}
                  className="relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-zinc-200/80 bg-white/80 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-zinc-50 dark:focus-visible:ring-zinc-50"
                  onClick={() => {
                    setOpenState((currentOpenState) =>
                      currentOpenState?.key === category.key && currentOpenState.pathname === pathname
                        ? null
                        : { key: category.key, pathname },
                    );
                  }}
                >
                  {isOpen || isActive ? (
                    <motion.span
                      layoutId="navigation-category-pill"
                      className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-zinc-50"
                      transition={panelTransition}
                    />
                  ) : null}
                  <span
                    className={[
                      'relative z-10',
                      isOpen || isActive ? 'text-zinc-50 dark:text-zinc-950' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {category.label}
                  </span>
                  <motion.svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className={[
                      'relative z-10 h-3.5 w-3.5',
                      isOpen || isActive ? 'text-zinc-50 dark:text-zinc-950' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={panelTransition}
                  >
                    <path
                      d="M4.25 6.5 8 10.25 11.75 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </motion.svg>
                </button>
              </div>
            );
          })}
        </LayoutGroup>
      </div>

      <AnimatePresence initial={false}>
        {openCategory ? (
          <motion.div
            id={`navigation-submenu-${openCategory.key}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={panelTransition}
            className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 origin-top rounded-[1.75rem] border border-zinc-200/80 bg-white/95 p-3 shadow-[0_32px_90px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95"
          >
            <motion.ul
              className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                closed: prefersReducedMotion ? {} : { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
                open: prefersReducedMotion ? {} : { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
              }}
            >
              {openCategory.links.map((link) => {
                const isCurrentPage = matchesPath(pathname, link.href);

                return (
                  <motion.li key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      aria-current={isCurrentPage ? 'page' : undefined}
                      className={[
                        'flex min-h-16 items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                        isCurrentPage
                          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                          : 'bg-zinc-50/90 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-zinc-50',
                      ].join(' ')}
                      onClick={() => {
                        setOpenState(null);
                      }}
                    >
                      <span>{link.label}</span>
                      {settings.showHotkeyHints ? (
                        <span className="ml-auto rounded-full border border-zinc-200/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                          {link.hotkey}
                        </span>
                      ) : null}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
