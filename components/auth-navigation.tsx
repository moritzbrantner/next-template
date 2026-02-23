'use client';

import { signIn, signOut } from 'next-auth/react';

import { Link } from '@/i18n/navigation';

import { buttonVariants } from '@/components/ui/button';

type AuthNavigationProps = {
  isAuthenticated: boolean;
  locale: string;
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  labels: {
    login: string;
    profile: string;
    settings: string;
    logout: string;
    menu: string;
  };
};

function getAvatarFallback(user?: AuthNavigationProps['user']) {
  const name = user?.name?.trim();

  if (name) {
    return name[0]?.toUpperCase() ?? 'U';
  }

  const email = user?.email?.trim();
  if (email) {
    return email[0]?.toUpperCase() ?? 'U';
  }

  return 'U';
}

export function AuthNavigation({ isAuthenticated, locale, user, labels }: AuthNavigationProps) {
  const callbackUrl = `/${locale}`;

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => signIn(undefined, { callbackUrl })}
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        {labels.login}
      </button>
    );
  }

  const fallback = getAvatarFallback(user);

  return (
    <details className="group relative">
      <summary
        className="list-none cursor-pointer rounded-full p-0.5 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-800"
        aria-label={labels.menu}
      >
        <span className="sr-only">{labels.menu}</span>
        <span
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-200 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          style={
            user?.image
              ? {
                  backgroundImage: `url(${user.image})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                }
              : undefined
          }
        >
          {!user?.image ? fallback : null}
        </span>
      </summary>

      <div className="absolute right-0 top-10 z-20 min-w-40 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/profile" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full justify-start' })}>
          {labels.profile}
        </Link>
        <Link href="/settings" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full justify-start' })}>
          {labels.settings}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl })}
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full justify-start' })}
        >
          {labels.logout}
        </button>
      </div>
    </details>
  );
}
