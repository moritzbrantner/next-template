'use client';

import { forwardRef, type ComponentProps } from 'react';

import {
  Link as RouterLink,
  redirect as routerRedirect,
  useNavigate,
  useRouter as useTanStackRouter,
  useRouterState,
} from '@tanstack/react-router';

import { useLocale } from '@/src/i18n';
import { withLocalePath, stripLocaleFromPathname, type AppLocale } from '@/i18n/routing';

type LinkProps = Omit<ComponentProps<typeof RouterLink>, 'to'> & {
  href: string;
  locale?: AppLocale;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, locale, preload, ...props },
  ref,
) {
  const currentLocale = useLocale();

  return (
    <RouterLink
      {...props}
      preload={preload ?? 'intent'}
      ref={ref}
      to={withLocalePath(href, locale ?? currentLocale)}
    />
  );
});

export function redirect(href: string, locale?: AppLocale) {
  return routerRedirect({
    href: withLocalePath(href, locale),
  });
}

export function usePathname() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return stripLocaleFromPathname(pathname);
}

export function useRouter() {
  const currentLocale = useLocale();
  const navigate = useNavigate();
  const router = useTanStackRouter();

  return {
    push: (href: string, locale?: AppLocale) => navigate({ to: withLocalePath(href, locale ?? currentLocale) }),
    replace: (href: string, locale?: AppLocale) =>
      navigate({ to: withLocalePath(href, locale ?? currentLocale), replace: true }),
    refresh: () => router.invalidate(),
  };
}

export function getPathname(href: string, locale?: AppLocale) {
  return withLocalePath(href, locale);
}
