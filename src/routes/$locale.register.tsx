import { createFileRoute, redirect } from '@tanstack/react-router';

import { RegisterForm } from '@/components/auth/register-form';
import type { AppLocale } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/src/i18n';

export const Route = createFileRoute('/$locale/register')({
  beforeLoad: ({ context, params }) => {
    if (context.session?.user?.id) {
      throw redirect({
        to: '/$locale/profile',
        params: { locale: params.locale },
      });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const t = useTranslations('AuthPages.register');
  const { locale } = Route.useParams();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="order-2 space-y-6 lg:order-1">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{t('eyebrow')}</p>
        <div className="space-y-4">
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('heroTitle')}</h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">{t('heroDescription')}</p>
        </div>
      </section>

      <Card className="order-1 border-zinc-200/80 shadow-xl shadow-zinc-950/5 dark:border-zinc-800/80 dark:shadow-black/20 lg:order-2">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm
            locale={locale as AppLocale}
            labels={{
              name: t('form.name'),
              email: t('form.email'),
              password: t('form.password'),
              confirmPassword: t('form.confirmPassword'),
              submit: t('form.submit'),
              submitting: t('form.submitting'),
              requiredEmail: t('form.requiredEmail'),
              invalidEmail: t('form.invalidEmail'),
              requiredPassword: t('form.requiredPassword'),
              weakPassword: t('form.weakPassword'),
              requiredConfirmPassword: t('form.requiredConfirmPassword'),
              passwordMismatch: t('form.passwordMismatch'),
              nameTooLong: t('form.nameTooLong'),
              genericError: t('form.genericError'),
              loginPrompt: t('form.loginPrompt'),
              loginCta: t('form.loginCta'),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
