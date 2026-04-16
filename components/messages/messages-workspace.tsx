'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  DirectMessageConversationSummary,
  DirectMessagesPageData,
  SendDirectMessagePayload,
} from '@/src/domain/messages/use-cases';
import { readProblemDetail } from '@/src/http/problem-client';
import { useTranslations } from '@/src/i18n';
import { buildDirectMessagesPath } from '@/src/messages/paths';
import { buildPublicProfilePath } from '@/src/profile/tags';

type MessagesWorkspaceProps = {
  initialData: DirectMessagesPageData;
};

export function MessagesWorkspace({ initialData }: MessagesWorkspaceProps) {
  const t = useTranslations('MessagesPage');
  const router = useRouter();
  const [conversations, setConversations] = useState(initialData.conversations);
  const [selectedConversation, setSelectedConversation] = useState(initialData.selectedConversation);
  const [composeTarget, setComposeTarget] = useState(initialData.composeTarget);
  const [targetError] = useState(initialData.targetError);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const activeParticipant = selectedConversation?.participant ?? composeTarget;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeParticipant || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: activeParticipant.userId,
          body: draft,
        }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, t('composer.error'));
        setError(problem.message);
        return;
      }

      const payload = (await response.json()) as SendDirectMessagePayload;
      setDraft('');
      setComposeTarget(null);
      setSelectedConversation((current) => ({
        conversationId: payload.conversation.conversationId,
        participant: payload.participant,
        messages:
          current?.participant.userId === payload.participant.userId
            ? [...current.messages, payload.message]
            : [payload.message],
      }));
      setConversations((current) => {
        const next = current.filter((conversation) => conversation.participant.userId !== payload.participant.userId);
        return [payload.conversation, ...next];
      });
      router.replace(buildDirectMessagesPath(payload.participant.tag));
    } catch {
      setError(t('composer.error'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle>{t('list.title')}</CardTitle>
          <CardDescription>{t('list.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ConversationLink
                key={conversation.conversationId}
                conversation={conversation}
                isActive={conversation.participant.userId === activeParticipant?.userId}
                unreadLabel={t('list.unread', { count: conversation.unreadCount })}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {t('list.empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem]">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          {activeParticipant ? (
            <div className="flex items-center gap-4">
              <Avatar imageUrl={activeParticipant.imageUrl} displayName={activeParticipant.displayName} size="lg" />
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate">{activeParticipant.displayName}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  <span>/@{activeParticipant.tag}</span>
                  <Link
                    href={buildPublicProfilePath(activeParticipant.tag)}
                    className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                  >
                    {t('thread.viewProfile')}
                  </Link>
                </CardDescription>
              </div>
            </div>
          ) : (
            <>
              <CardTitle>{t('thread.emptyTitle')}</CardTitle>
              <CardDescription>{t('thread.emptyDescription')}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {targetError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
              {targetError}
            </p>
          ) : null}

          {selectedConversation ? (
            <div className="space-y-3">
              {selectedConversation.messages.map((message) => (
                <article
                  key={message.id}
                  className={[
                    'max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6',
                    message.isOwnMessage
                      ? 'ml-auto bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100',
                  ].join(' ')}
                >
                  <p>{message.body}</p>
                  <p
                    className={[
                      'mt-2 text-xs',
                      message.isOwnMessage ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400',
                    ].join(' ')}
                  >
                    {formatMessageTimestamp(message.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : activeParticipant ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
              <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('thread.startTitle')}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {t('thread.startDescription', { name: activeParticipant.displayName })}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
              <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{t('thread.emptyTitle')}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t('thread.emptyDescription')}</p>
              <Link href="/people" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
                {t('thread.emptyAction')}
              </Link>
            </div>
          )}

          {activeParticipant ? (
            <form className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800" onSubmit={handleSubmit}>
              <Label htmlFor="direct-message-body">{t('composer.label')}</Label>
              <Textarea
                id="direct-message-body"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('composer.placeholder')}
                rows={4}
                disabled={isSending}
              />
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('composer.helper')}</p>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSending || !draft.trim()}>
                  {isSending ? t('composer.sending') : t('composer.send')}
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ConversationLink({
  conversation,
  isActive,
  unreadLabel,
}: {
  conversation: DirectMessageConversationSummary;
  isActive: boolean;
  unreadLabel: string;
}) {
  return (
    <Link
      href={buildDirectMessagesPath(conversation.participant.tag)}
      className={[
        'flex items-center gap-3 rounded-2xl border p-3 transition-colors',
        isActive
          ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900'
          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/70',
      ].join(' ')}
    >
      <Avatar imageUrl={conversation.participant.imageUrl} displayName={conversation.participant.displayName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">{conversation.participant.displayName}</p>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
            {formatMessageTimestamp(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">{conversation.lastMessageSnippet}</p>
        {conversation.unreadCount > 0 ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-200">{unreadLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

function Avatar({
  imageUrl,
  displayName,
  size,
}: {
  imageUrl: string | null;
  displayName: string;
  size: 'sm' | 'lg';
}) {
  const dimension = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';

  return (
    <div
      className={`relative flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes={size === 'lg' ? '56px' : '44px'}
          unoptimized
          className="object-cover"
        />
      ) : (
        <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
      )}
    </div>
  );
}

function formatMessageTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
