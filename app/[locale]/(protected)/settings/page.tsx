import { getAccountCapabilitiesUseCase } from '@/src/domain/account/use-cases';
import { getConsentState } from '@/src/privacy/consent';
import { getPermissionSetForRole } from '@/src/domain/authorization/service';
import {
  getProfileFollowerVisibilityUseCase,
  getProfileSearchVisibilityUseCase,
  listBlockedProfilesUseCase,
} from '@/src/domain/profile/use-cases';
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
  const [
    visibilityResult,
    followerVisibilityResult,
    blockedProfilesResult,
    permissionSet,
    accountCapabilities,
  ] = await Promise.all([
    getProfileSearchVisibilityUseCase(session.user.id),
    getProfileFollowerVisibilityUseCase(session.user.id),
    listBlockedProfilesUseCase(session.user.id),
    getPermissionSetForRole(session.user.role),
    getAccountCapabilitiesUseCase(session.user.id),
  ]);

  return (
    <SettingsClient
      locale={locale}
      session={session}
      consent={consent.state}
      currentPermissions={[...permissionSet]}
      accountCapabilities={accountCapabilities}
      initialSearchVisibility={
        visibilityResult.ok ? visibilityResult.data.isSearchable : true
      }
      initialFollowerVisibility={
        followerVisibilityResult.ok
          ? followerVisibilityResult.data.followerVisibility
          : 'PUBLIC'
      }
      initialBlockedProfiles={
        blockedProfilesResult.ok ? blockedProfilesResult.data.profiles : []
      }
    />
  );
}
