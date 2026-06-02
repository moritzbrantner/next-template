'use client';

import {
  PlatformNavbar,
  PlatformNavbarActionGroup,
  type PlatformNavbarGroup,
  type PlatformNavbarRenderLinkProps,
  type PlatformNavbarVariant,
} from '@moritzbrantner/ui';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';

type LocaleShellNavbarProps = {
  brandHref: string;
  brandLabel: string;
  groups: PlatformNavbarGroup[];
  actions: ReactNode;
};

const MOBILE_NAVBAR_QUERY = '(max-width: 639px)';

function getMobileNavbarSnapshot() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia(MOBILE_NAVBAR_QUERY).matches
  );
}

function subscribeMobileNavbar(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MOBILE_NAVBAR_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange);
  };
}

function renderNavbarLink({
  href,
  className,
  children,
  onClick,
  disabled,
  'aria-current': ariaCurrent,
}: PlatformNavbarRenderLinkProps) {
  if (!href || disabled) {
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        aria-current={ariaCurrent}
      >
        {children}
      </button>
    );
  }

  return (
    <NextLink
      href={href}
      className={className}
      onClick={onClick}
      aria-current={ariaCurrent}
    >
      {children}
    </NextLink>
  );
}

export function LocaleShellNavbar({
  brandHref,
  brandLabel,
  groups,
  actions,
}: LocaleShellNavbarProps) {
  const pathname = usePathname();
  const isMobileNavbar = useSyncExternalStore(
    subscribeMobileNavbar,
    getMobileNavbarSnapshot,
    () => false,
  );
  const navbarVariant: PlatformNavbarVariant = isMobileNavbar
    ? 'mobile'
    : 'web';
  const brand = (
    <NextLink href={brandHref} className="block truncate">
      {brandLabel}
    </NextLink>
  );

  return (
    <header className="sticky top-0 z-10 overflow-visible border-b border-zinc-200 bg-white/95 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/95">
      <PlatformNavbar
        key={pathname}
        aria-label="Primary navigation"
        brand={brand}
        groups={groups}
        actionSlot={
          <PlatformNavbarActionGroup className="min-w-0 max-w-[calc(100vw-8rem)] shrink flex-wrap gap-1 sm:max-w-none sm:shrink-0 sm:flex-nowrap sm:gap-2">
            {actions}
          </PlatformNavbarActionGroup>
        }
        variant={navbarVariant}
        defaultOpenGroupId={null}
        renderLink={renderNavbarLink}
      />
    </header>
  );
}
