'use client';

import Image from 'next/image';
import { Search, UserPlus, X } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileDirectoryEntry } from '@/src/domain/profile/use-cases';
import { readProblemDetail } from '@/src/http/problem-client';
import { useTranslations } from '@/src/i18n';

type FriendsDirectoryProps = {
  initialFriends: ProfileDirectoryEntry[];
};

type FollowMutationResponse = {
  isFriend?: boolean;
};

export function FriendsDirectory({ initialFriends }: FriendsDirectoryProps) {
  const t = useTranslations('PeoplePage');
  const searchErrorMessage = t('search.error');
  const followErrorMessage = t('actions.error');
  const blockErrorMessage = t('actions.blockError');
  const [friendProfiles, setFriendProfiles] = useState(initialFriends);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [searchResults, setSearchResults] = useState<ProfileDirectoryEntry[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const normalizedQuery = deferredQuery.trim();

    if (!normalizedQuery) {
      setIsSearching(false);
      setSearchError(null);
      setSearchResults([]);
      return;
    }

    const abortController = new AbortController();

    async function loadSearchResults() {
      setIsSearching(true);
      setSearchError(null);

      try {
        const searchParams = new URLSearchParams({
          query: normalizedQuery,
          refresh: String(refreshKey),
        });
        const response = await fetch(
          `/api/profile/search?${searchParams.toString()}`,
          {
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          const problem = await readProblemDetail(response, searchErrorMessage);
          setSearchError(problem.message);
          setSearchResults([]);
          return;
        }

        const payload = (await response.json()) as {
          profiles?: ProfileDirectoryEntry[];
        };
        setSearchResults(payload.profiles ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setSearchError(searchErrorMessage);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }

    void loadSearchResults();

    return () => {
      abortController.abort();
    };
  }, [deferredQuery, isSearchOpen, refreshKey, searchErrorMessage]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  function markPendingUser(userId: string, isPending: boolean) {
    setPendingUserIds((current) => {
      if (isPending) {
        return current.includes(userId) ? current : [...current, userId];
      }

      return current.filter((currentUserId) => currentUserId !== userId);
    });
  }

  async function updateFollowState(
    profile: ProfileDirectoryEntry,
    shouldFollow: boolean,
  ) {
    markPendingUser(profile.userId, true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch('/api/profile/follow', {
        method: shouldFollow ? 'POST' : 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.userId }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, followErrorMessage);
        setActionError(problem.message);
        return;
      }

      const payload = (await response.json()) as FollowMutationResponse;

      if (shouldFollow) {
        if (payload.isFriend) {
          setFriendProfiles((current) =>
            current.some(
              (currentProfile) => currentProfile.userId === profile.userId,
            )
              ? current
              : [profile, ...current],
          );
          setActionMessage(
            t('actions.friendAdded', { name: profile.displayName }),
          );
        } else {
          setActionMessage(
            t('actions.followAdded', { name: profile.displayName }),
          );
        }
        setSearchResults((current) =>
          current.filter(
            (currentProfile) => currentProfile.userId !== profile.userId,
          ),
        );
      } else {
        setFriendProfiles((current) =>
          current.filter(
            (currentProfile) => currentProfile.userId !== profile.userId,
          ),
        );
      }

      setRefreshKey((current) => current + 1);
    } catch {
      setActionError(followErrorMessage);
    } finally {
      markPendingUser(profile.userId, false);
    }
  }

  async function blockProfile(profile: ProfileDirectoryEntry) {
    markPendingUser(profile.userId, true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch('/api/profile/block', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.userId }),
      });

      if (!response.ok) {
        const problem = await readProblemDetail(response, blockErrorMessage);
        setActionError(problem.message);
        return;
      }

      setFriendProfiles((current) =>
        current.filter(
          (currentProfile) => currentProfile.userId !== profile.userId,
        ),
      );
      setSearchResults((current) =>
        current.filter(
          (currentProfile) => currentProfile.userId !== profile.userId,
        ),
      );
      setRefreshKey((current) => current + 1);
    } catch {
      setActionError(blockErrorMessage);
    } finally {
      markPendingUser(profile.userId, false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t('friends.title')}</CardTitle>
            <CardDescription>
              {friendProfiles.length > 0
                ? t('friends.description', { count: friendProfiles.length })
                : t('friends.empty')}
            </CardDescription>
          </div>
          <Button
            type="button"
            className="gap-2 self-start"
            onClick={() => setIsSearchOpen(true)}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t('actions.addFriend')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {actionError}
            </p>
          ) : null}
          {actionMessage ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {actionMessage}
            </p>
          ) : null}

          {friendProfiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              {t('friends.empty')}
            </div>
          ) : null}

          {friendProfiles.map((profile) => (
            <ProfileRow
              key={profile.userId}
              profile={profile}
              actionLabel={t('actions.unfollow')}
              pendingLabel={t('actions.unfollowing')}
              actionVariant="outline"
              isPending={pendingUserIds.includes(profile.userId)}
              onAction={() => updateFollowState(profile, false)}
              secondaryActionLabel={t('actions.block')}
              secondaryPendingLabel={t('actions.blocking')}
              onSecondaryAction={() => blockProfile(profile)}
            />
          ))}
        </CardContent>
      </Card>

      {isSearchOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/55 px-4 py-16 backdrop-blur-sm sm:items-center sm:py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsSearchOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="friend-search-title"
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800">
              <div className="space-y-1">
                <h2
                  id="friend-search-title"
                  className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
                >
                  {t('search.title')}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {t('search.description')}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                aria-label={t('search.close')}
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.placeholder')}
                  autoFocus
                  className="pl-9"
                />
              </div>

              {isSearching ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {t('search.loading')}
                </p>
              ) : null}
              {searchError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {searchError}
                </p>
              ) : null}
              {actionError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {actionError}
                </p>
              ) : null}
              {actionMessage ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {actionMessage}
                </p>
              ) : null}

              {!deferredQuery.trim() ? (
                <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {t('search.idle')}
                </div>
              ) : null}

              {deferredQuery.trim() &&
              !isSearching &&
              !searchError &&
              searchResults.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {t('search.empty')}
                </div>
              ) : null}

              {searchResults.length > 0 ? (
                <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                  {searchResults.map((profile) => (
                    <ProfileRow
                      key={profile.userId}
                      profile={profile}
                      actionLabel={t('actions.follow')}
                      pendingLabel={t('actions.following')}
                      actionVariant="default"
                      isPending={pendingUserIds.includes(profile.userId)}
                      onAction={() => updateFollowState(profile, true)}
                      secondaryActionLabel={t('actions.block')}
                      secondaryPendingLabel={t('actions.blocking')}
                      onSecondaryAction={() => blockProfile(profile)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProfileRow({
  profile,
  actionLabel,
  pendingLabel,
  actionVariant,
  isPending,
  onAction,
  secondaryActionLabel,
  secondaryPendingLabel,
  onSecondaryAction,
}: {
  profile: ProfileDirectoryEntry;
  actionLabel: string;
  pendingLabel: string;
  actionVariant: 'default' | 'outline';
  isPending: boolean;
  onAction: () => void;
  secondaryActionLabel?: string;
  secondaryPendingLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 dark:border-zinc-800">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar imageUrl={profile.imageUrl} displayName={profile.displayName} />
        <div className="min-w-0">
          <Link
            href={`/profile/@${profile.tag}`}
            className="block truncate font-medium hover:underline"
          >
            {profile.displayName}
          </Link>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            /@{profile.tag}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {secondaryActionLabel && onSecondaryAction ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={onSecondaryAction}
          >
            {isPending ? secondaryPendingLabel : secondaryActionLabel}
          </Button>
        ) : null}

        <Button
          type="button"
          variant={actionVariant}
          size="sm"
          disabled={isPending}
          onClick={onAction}
        >
          {isPending ? pendingLabel : actionLabel}
        </Button>
      </div>
    </div>
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
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
      )}
    </div>
  );
}
