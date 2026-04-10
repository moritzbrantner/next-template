import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTranslator } from '@/src/i18n/messages';
import { resolveLocale } from '@/src/server/page-guards';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { token = '' } = await searchParams;
  const t = createTranslator(locale, 'AuthPages.resetPassword');

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-3xl items-center">
      <Card className="border-zinc-200/80 shadow-xl shadow-zinc-950/5 dark:border-zinc-800/80 dark:shadow-black/20">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{t('eyebrow')}</p>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm
              locale={locale}
              token={token}
              labels={{
                password: t('form.password'),
                confirmPassword: t('form.confirmPassword'),
                submit: t('form.submit'),
                submitting: t('form.submitting'),
                requiredPassword: t('form.requiredPassword'),
                weakPassword: t('form.weakPassword'),
                requiredConfirmPassword: t('form.requiredConfirmPassword'),
                passwordMismatch: t('form.passwordMismatch'),
                genericError: t('form.genericError'),
                success: t('success'),
                loginCta: t('loginCta'),
              }}
            />
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">{t('missingToken')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
