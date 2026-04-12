import { getConsentState } from '@/src/privacy/consent';
import { getProfileSearchVisibilityUseCase } from '@/src/domain/profile/use-cases';
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
  const consent = await getConsentState();
  const visibilityResult = await getProfileSearchVisibilityUseCase(session.user.id);

  return (
    <SettingsClient
      locale={locale}
      session={session}
      consent={consent.state}
      initialSearchVisibility={visibilityResult.ok ? visibilityResult.data.isSearchable : true}
    />
  );
}
