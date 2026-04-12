'use client';

import { useState } from 'react';

import type { ConsentState } from '@/src/privacy/consent';

async function saveConsent(state: ConsentState) {
  await fetch('/api/privacy/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });
}

export function ConsentBanner({
  initialConsent,
  visible,
}: {
  initialConsent: ConsentState;
  visible: boolean;
}) {
  const [isVisible, setIsVisible] = useState(visible);
  const [isSaving, setIsSaving] = useState(false);

  if (!isVisible) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Privacy controls</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Analytics stays off until you opt in. Marketing parameters are allowlisted and sensitive query params are redacted.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
            onClick={async () => {
              setIsSaving(true);
              await saveConsent({ necessary: true, analytics: false, marketing: false });
              setIsSaving(false);
              setIsVisible(false);
            }}
          >
            Necessary only
          </button>
          <button
            type="button"
            disabled={isSaving}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
            onClick={async () => {
              setIsSaving(true);
              await saveConsent({ ...initialConsent, necessary: true, analytics: true, marketing: true });
              setIsSaving(false);
              setIsVisible(false);
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </section>
  );
}
