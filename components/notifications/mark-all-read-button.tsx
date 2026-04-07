'use client';

import { useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/src/i18n';

type MarkAllReadButtonProps = {
  disabled?: boolean;
};

export function MarkAllReadButton({ disabled = false }: MarkAllReadButtonProps) {
  const t = useTranslations('NotificationsPage');
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const response = await fetch('/api/notifications/read', {
      method: 'POST',
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(body?.error ?? t('actions.markAllReadError'));
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled={disabled || pending} onClick={handleClick}>
        {pending ? t('actions.markingAllRead') : t('actions.markAllRead')}
      </Button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
