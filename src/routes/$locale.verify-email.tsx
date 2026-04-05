import { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const t = useTranslations('AuthPages.verifyEmail');
  const { locale } = Route.useParams();
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch(`/api/account/verify-email?token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        setStatus(response.ok ? 'success' : 'error');
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-3xl items-center">
      <Card className="border-zinc-200/80 shadow-xl shadow-zinc-950/5 dark:border-zinc-800/80 dark:shadow-black/20">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{t('eyebrow')}</p>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('verifying')}</p> : null}
          {status === 'success' ? (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
              {t('success')}
            </p>
          ) : null}
          {status === 'error' ? <p className="text-sm text-red-600 dark:text-red-400">{t('error')}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              locale={locale as AppLocale}
              className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            >
              {t('loginCta')}
            </Link>
            <Link
              href="/register"
              locale={locale as AppLocale}
              className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
            >
              {t('registerCta')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
