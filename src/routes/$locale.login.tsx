import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginForm } from '@/components/auth/login-form';
import type { AppLocale } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/login')({
  beforeLoad: ({ context, params }) => {
    if (context.session?.user?.id) {
      throw redirect({
        to: '/$locale/profile',
        params: { locale: params.locale },
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const t = useTranslations('AuthPages.login');
  const { locale } = Route.useParams();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{t('eyebrow')}</p>
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('heroTitle')}</h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">{t('heroDescription')}</p>
        </div>
      </section>

      <Card className="border-zinc-200/80 shadow-xl shadow-zinc-950/5 dark:border-zinc-800/80 dark:shadow-black/20">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            locale={locale as AppLocale}
            labels={{
              email: t('form.email'),
              password: t('form.password'),
              submit: t('form.submit'),
              submitting: t('form.submitting'),
              invalidCredentials: t('form.invalidCredentials'),
              requiredEmail: t('form.requiredEmail'),
              invalidEmail: t('form.invalidEmail'),
              requiredPassword: t('form.requiredPassword'),
              registerPrompt: t('form.registerPrompt'),
              registerCta: t('form.registerCta'),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
