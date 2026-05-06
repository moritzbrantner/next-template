'use client';

import { BarChart3, ListChecks, MessageSquare, Pin, Send } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  ChatMessageInput,
  ChatMessageKind,
  ChatMessageMetadata,
} from '@/src/domain/chat/messages';

export type ChatToolMessage = {
  id: string;
  body: string;
  kind: ChatMessageKind;
  metadata: ChatMessageMetadata;
  pinnedAt: string | null;
};

export type ChatMessageLabels = {
  textMode: string;
  pollMode: string;
  todoMode: string;
  messagePlaceholder: string;
  pollPlaceholder: string;
  todoPlaceholder: string;
  send: string;
  sending: string;
  pinned: string;
  pin: string;
  unpin: string;
  voteFor: string;
  votes: string;
  voted: string;
  completeItem: string;
};

type ChatMessageComposerProps = {
  labels: ChatMessageLabels;
  isSending: boolean;
  onSubmit: (input: ChatMessageInput) => Promise<void>;
};

export function ChatMessageComposer({
  labels,
  isSending,
  onSubmit,
}: ChatMessageComposerProps) {
  const [kind, setKind] = useState<ChatMessageKind>('text');
  const [draft, setDraft] = useState('');
  const input = useMemo(() => buildMessageInput(kind, draft), [draft, kind]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input) {
      return;
    }

    await onSubmit(input);
    setDraft('');
    setKind('text');
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2">
        <ModeButton
          active={kind === 'text'}
          label={labels.textMode}
          onClick={() => setKind('text')}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </ModeButton>
        <ModeButton
          active={kind === 'poll'}
          label={labels.pollMode}
          onClick={() => setKind('poll')}
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </ModeButton>
        <ModeButton
          active={kind === 'todo'}
          label={labels.todoMode}
          onClick={() => setKind('todo')}
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </ModeButton>
      </div>

      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={
          kind === 'poll'
            ? labels.pollPlaceholder
            : kind === 'todo'
              ? labels.todoPlaceholder
              : labels.messagePlaceholder
        }
        aria-label={
          kind === 'poll'
            ? labels.pollMode
            : kind === 'todo'
              ? labels.todoMode
              : labels.messagePlaceholder
        }
        maxLength={kind === 'text' ? 500 : 1000}
      />
      <div className="flex justify-end">
        <Button type="submit" className="gap-2" disabled={isSending || !input}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {isSending ? labels.sending : labels.send}
        </Button>
      </div>
    </form>
  );
}

export function ChatMessageContent({
  message,
  currentUserId,
  labels,
  isOwnMessage,
  disabled,
  onVote,
  onToggleTodo,
}: {
  message: ChatToolMessage;
  currentUserId: string;
  labels: ChatMessageLabels;
  isOwnMessage: boolean;
  disabled: boolean;
  onVote: (messageId: string, optionId: string) => void;
  onToggleTodo: (messageId: string, itemId: string, completed: boolean) => void;
}) {
  if (message.kind === 'poll' && message.metadata.poll) {
    const options = message.metadata.poll.options;
    const totalVotes = options.reduce(
      (total, option) => total + option.voterUserIds.length,
      0,
    );

    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap break-words font-medium">
          {message.body}
        </p>
        <div className="space-y-2">
          {options.map((option) => {
            const hasVoted = option.voterUserIds.includes(currentUserId);
            const percentage =
              totalVotes > 0
                ? Math.round((option.voterUserIds.length / totalVotes) * 100)
                : 0;

            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onVote(message.id, option.id)}
                aria-label={`${labels.voteFor} ${option.text}`}
                className={[
                  'relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60',
                  isOwnMessage
                    ? 'border-white/25 bg-white/10 hover:bg-white/15'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute inset-y-0 left-0',
                    isOwnMessage
                      ? 'bg-white/15'
                      : 'bg-zinc-200 dark:bg-zinc-700',
                  ].join(' ')}
                  style={{ width: `${percentage}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex items-center justify-between gap-3">
                  <span>{option.text}</span>
                  <span className="shrink-0 text-xs">
                    {option.voterUserIds.length} {labels.votes}
                    {hasVoted ? ` ${labels.voted}` : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (message.kind === 'todo' && message.metadata.todo) {
    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap break-words font-medium">
          {message.body}
        </p>
        <div className="space-y-2">
          {message.metadata.todo.items.map((item) => (
            <label
              key={item.id}
              className={[
                'flex items-start gap-2 rounded-md px-2 py-1.5',
                isOwnMessage ? 'bg-white/10' : 'bg-zinc-50 dark:bg-zinc-900',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={item.completed}
                disabled={disabled}
                onChange={(event) =>
                  onToggleTodo(message.id, item.id, event.target.checked)
                }
                aria-label={`${labels.completeItem} ${item.text}`}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <span
                className={[
                  'break-words',
                  item.completed ? 'line-through opacity-70' : '',
                ].join(' ')}
              >
                {item.text}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap break-words">{message.body}</p>;
}

export function PinnedMessagesSummary({
  messages,
  labels,
}: {
  messages: ChatToolMessage[];
  labels: ChatMessageLabels;
}) {
  const pinnedMessages = messages.filter((message) => message.pinnedAt);

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Pin className="h-4 w-4" aria-hidden="true" />
        {labels.pinned}
      </div>
      <div className="flex flex-wrap gap-2">
        {pinnedMessages.map((message) => (
          <Badge key={message.id} variant="outline" className="max-w-full">
            <span className="truncate">{message.body}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function PinMessageButton({
  pinned,
  labels,
  disabled,
  onClick,
}: {
  pinned: boolean;
  labels: ChatMessageLabels;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-current opacity-70 transition hover:opacity-100 disabled:opacity-40"
      aria-label={pinned ? labels.unpin : labels.pin}
      title={pinned ? labels.unpin : labels.pin}
    >
      <Pin
        className={['h-3.5 w-3.5', pinned ? 'fill-current' : ''].join(' ')}
        aria-hidden="true"
      />
    </button>
  );
}

function ModeButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="gap-2"
      onClick={onClick}
    >
      {children}
      {label}
    </Button>
  );
}

function buildMessageInput(
  kind: ChatMessageKind,
  draft: string,
): ChatMessageInput | null {
  const lines = draft
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (kind === 'text') {
    const body = draft.trim();
    return body ? { body, kind } : null;
  }

  const [body, ...entries] = lines;

  if (!body) {
    return null;
  }

  if (kind === 'poll') {
    return entries.length >= 2 ? { body, kind, options: entries } : null;
  }

  return entries.length >= 1 ? { body, kind, items: entries } : null;
}
