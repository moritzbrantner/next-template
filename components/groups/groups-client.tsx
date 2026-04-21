'use client';

import { useState, type FormEvent } from 'react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { GroupInvitationSummary, GroupSummary } from '@/src/domain/groups/use-cases';
import { readProblemDetail } from '@/src/http/problem-client';
import { useTranslations } from '@/src/i18n';

type GroupsClientProps = {
  initialGroups: GroupSummary[];
  initialInvitations: GroupInvitationSummary[];
};

export function GroupsClient({ initialGroups, initialInvitations }: GroupsClientProps) {
  const t = useTranslations('GroupsPage');
  const [groups, setGroups] = useState(initialGroups);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, t('errors.create'));
        setError(problem.message);
        return;
      }

      const payload = (await response.json()) as { group?: GroupSummary };

      if (payload.group) {
        setGroups((current) => [payload.group!, ...current]);
        setName('');
        setDescription('');
      }
    } catch {
      setError(t('errors.create'));
    } finally {
      setIsCreating(false);
    }
  }

  async function respondToInvitation(invitation: GroupInvitationSummary, decision: 'accept' | 'decline') {
    setPendingInvitationId(invitation.id);
    setError(null);

    try {
      const response = await fetch('/api/groups/invitations/respond', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ invitationId: invitation.id, decision }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, t('errors.invitation'));
        setError(problem.message);
        return;
      }

      const payload = (await response.json()) as { group?: GroupSummary | null };
      setInvitations((current) => current.filter((currentInvitation) => currentInvitation.id !== invitation.id));

      if (payload.group) {
        setGroups((current) =>
          current.some((group) => group.id === payload.group!.id) ? current : [payload.group!, ...current],
        );
      }
    } catch {
      setError(t('errors.invitation'));
    } finally {
      setPendingInvitationId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('create.title')}</CardTitle>
            <CardDescription>{t('create.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateGroup}>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('create.namePlaceholder')}
                aria-label={t('create.nameLabel')}
                maxLength={80}
                required
              />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('create.descriptionPlaceholder')}
                aria-label={t('create.descriptionLabel')}
                maxLength={500}
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? t('create.creating') : t('create.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('invitations.title')}</CardTitle>
            <CardDescription>
              {invitations.length > 0
                ? t('invitations.description', { count: invitations.length })
                : t('invitations.empty')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="space-y-1">
                  <p className="font-medium">{invitation.groupName}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {t('invitations.invitedBy', { name: invitation.invitedBy.displayName })}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pendingInvitationId === invitation.id}
                    onClick={() => respondToInvitation(invitation, 'accept')}
                  >
                    {pendingInvitationId === invitation.id ? t('invitations.accepting') : t('invitations.accept')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingInvitationId === invitation.id}
                    onClick={() => respondToInvitation(invitation, 'decline')}
                  >
                    {pendingInvitationId === invitation.id ? t('invitations.declining') : t('invitations.decline')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('groups.title')}</CardTitle>
          <CardDescription>{groups.length > 0 ? t('groups.description', { count: groups.length }) : t('groups.empty')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{group.name}</p>
                  {group.description ? (
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{group.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {t(`roles.${group.role}`)}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {t('groups.meta', {
                  members: group.memberCount,
                  invitations: group.pendingInvitationCount,
                })}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
