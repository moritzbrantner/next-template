import { requireAuth, resolveLocale } from '@/src/server/page-guards';

import { SettingsClient } from './settings-client';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const session = await requireAuth(locale);

  return <SettingsClient locale={locale} session={session} />;
}
