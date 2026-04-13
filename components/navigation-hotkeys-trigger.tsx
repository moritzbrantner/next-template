'use client';

import dynamic from 'next/dynamic';

import type { AppSession } from '@/src/auth';

const NavigationHotkeys = dynamic(
  () => import('@/components/navigation-hotkeys').then((module) => module.NavigationHotkeys),
);

export function NavigationHotkeysTrigger({
  session,
}: {
  session: AppSession | null;
}) {
  return <NavigationHotkeys session={session} />;
}
