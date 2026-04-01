'use client';

import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { imageConstraints } from '@/src/profile/image-validation';

type ProfileImageFormProps = {
  currentImage: string | null;
  labels: {
    upload: string;
    uploading: string;
    remove: string;
    chooseImage: string;
    hint: string;
    success: string;
    empty: string;
    alt: string;
  };
};

export function ProfileImageForm({ currentImage, labels }: ProfileImageFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});

    const response = await fetch('/api/profile/image', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setState({ error: body?.error ?? 'Unable to update profile picture right now. Please try again.' });
      setPending(false);
      return;
    }

    setState({ success: true });
    setPending(false);
    router.refresh();
  }

  async function handleRemove() {
    setPending(true);
    setState({});

    const response = await fetch('/api/profile/image/remove', {
      method: 'POST',
    });

    if (!response.ok) {
      setState({ error: 'Unable to update profile picture right now. Please try again.' });
      setPending(false);
      return;
    }

    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
          {currentImage ? (
            <img src={currentImage} alt={labels.alt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">{labels.empty}</div>
          )}
        </div>

        {currentImage ? (
          <Button type="button" variant="ghost" onClick={() => void handleRemove()} disabled={pending}>
            {labels.remove}
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleUpload} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">
            {labels.chooseImage}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/png,image/jpeg"
            className="block w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700"
            required
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.hint}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {`Max ${(imageConstraints.maxUploadBytes / (1024 * 1024)).toFixed(0)}MB · ${imageConstraints.minDimensionPx}-${imageConstraints.maxDimensionPx}px`}
          </p>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? labels.uploading : labels.upload}
        </Button>

        {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{labels.success}</p> : null}
      </form>
    </div>
  );
}
