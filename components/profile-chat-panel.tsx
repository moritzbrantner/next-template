'use client';

import Image from 'next/image';
import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProfileChatMessage,
  ProfileDirectoryEntry,
} from '@/src/domain/profile/use-cases';
import { readProblemDetail } from '@/src/http/problem-client';
import { useTranslations } from '@/src/i18n';

type ProfileChatPanelProps = {
  currentUserId: string;
  member: ProfileDirectoryEntry;
  initialMessages: ProfileChatMessage[];
};

type SendMessageResponse = {
  notificationId?: string;
};

export function ProfileChatPanel({
  currentUserId,
  member,
  initialMessages,
}: ProfileChatPanelProps) {
  const t = useTranslations('ProfileChatPage');
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();

    if (!body) {
      return;
    }

    setIsSending(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/profile/message', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: member.userId, message: body }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, t('error'));
        setError(problem.message);
        return;
      }

      const payload = (await response.json()) as SendMessageResponse;
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: payload.notificationId ?? `local-${Date.now()}`,
          senderUserId: currentUserId,
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
      setDraft('');
      setFeedback(t('sent'));
    } catch {
      setError(t('error'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar imageUrl={member.imageUrl} displayName={member.displayName} />
        <CardTitle>
          {t('conversationWith', { name: member.displayName })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[32rem] space-y-3 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isOwnMessage = message.senderUserId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      isOwnMessage
                        ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        : 'border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwnMessage
                          ? 'text-zinc-300 dark:text-zinc-600'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {formatChatMessageDate(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t('noMessages')}
            </p>
          )}
        </div>

        {feedback ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('messagePlaceholder')}
            aria-label={t('messagePlaceholder')}
            maxLength={500}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="gap-2"
              disabled={isSending || draft.trim().length === 0}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSending ? t('sending') : t('send')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Avatar({
  imageUrl,
  displayName,
}: {
  imageUrl: string | null;
  displayName: string;
}) {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes="44px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
      )}
    </div>
  );
}

function formatChatMessageDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
