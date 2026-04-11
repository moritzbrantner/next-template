'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type BlogPostComposerProps = {
  labels: {
    title: string;
    titlePlaceholder: string;
    content: string;
    contentPlaceholder: string;
    publish: string;
    publishing: string;
    success: string;
    error: string;
  };
};

export function BlogPostComposer({ labels }: BlogPostComposerProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/profile/blog-posts', {
        method: 'POST',
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setState({ error: body?.error ?? labels.error });
        setPending(false);
        return;
      }

      form.reset();
      setState({ success: true });
      setPending(false);
      router.refresh();
    } catch {
      setState({ error: labels.error });
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="blog-post-title">{labels.title}</Label>
        <Input
          id="blog-post-title"
          name="title"
          minLength={4}
          maxLength={120}
          placeholder={labels.titlePlaceholder}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blog-post-content">{labels.content}</Label>
        <Textarea
          id="blog-post-content"
          name="content"
          minLength={20}
          maxLength={10000}
          placeholder={labels.contentPlaceholder}
          className="min-h-56"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? labels.publishing : labels.publish}
      </Button>

      {state.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{labels.success}</p> : null}
    </form>
  );
}
