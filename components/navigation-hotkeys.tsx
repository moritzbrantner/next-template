'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/src/i18n';
import { getVisibleAppPages, type AppPageDefinition } from '@/src/navigation/app-routes';
import { useAppSettings } from '@/src/settings/provider';
import type { AppSession } from '@/src/auth';

type NavigationHotkeysProps = {
  session: AppSession | null;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

function formatShortcut(shortcut: readonly [string, string]) {
  return shortcut.map((part) => part.toUpperCase()).join(' ');
}

export function NavigationHotkeys({ session }: NavigationHotkeysProps) {
  const t = useTranslations('NavigationBar');
  const router = useRouter();
  const { settings } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [leaderKeyActive, setLeaderKeyActive] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pages = useMemo(
    () =>
      getVisibleAppPages({
        isAuthenticated: Boolean(session?.user?.id),
        role: session?.user?.role,
      }),
    [session?.user?.id, session?.user?.role],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [open]);

  useEffect(() => {
    let leaderTimer: number | undefined;

    const clearLeader = () => {
      if (typeof leaderTimer === 'number') {
        window.clearTimeout(leaderTimer);
        leaderTimer = undefined;
      }

      setLeaderKeyActive(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (open) {
          setOpen(false);
        }
        clearLeader();
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if ((event.key === '?' && !event.metaKey && !event.ctrlKey) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        setOpen((currentOpenState) => !currentOpenState);
        clearLeader();
        return;
      }

      if (!leaderKeyActive && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        setLeaderKeyActive(true);
        leaderTimer = window.setTimeout(() => {
          setLeaderKeyActive(false);
          leaderTimer = undefined;
        }, 1200);
        return;
      }

      if (!leaderKeyActive) {
        return;
      }

      const matchingPage = pages.find((page) => page.hotkey[1] === event.key.toLowerCase());
      clearLeader();

      if (!matchingPage) {
        return;
      }

      event.preventDefault();
      router.push(matchingPage.href);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearLeader();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [leaderKeyActive, open, pages, router]);

  const groupedPages = pages.reduce<Record<string, AppPageDefinition[]>>((groups, page) => {
    const groupKey =
      page.navigationCategory === 'discover'
        ? t('categories.discover')
        : page.navigationCategory === 'workspace'
          ? t('categories.workspace')
          : page.navigationCategory === 'admin'
            ? t('categories.admin')
            : t('hotkeys.accountGroup');
    groups[groupKey] ??= [];
    groups[groupKey].push(page);
    return groups;
  }, {});

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = Object.entries(groupedPages)
    .map(([groupLabel, groupPages]) => [
      groupLabel,
      groupPages.filter((page) => {
        if (!normalizedQuery) {
          return true;
        }

        const label = t(page.translationKey).toLowerCase();
        const searchValue = `${groupLabel} ${label} ${page.hotkey.join(' ')}`.toLowerCase();
        return searchValue.includes(normalizedQuery);
      }),
    ] as const)
    .filter(([, groupPages]) => groupPages.length > 0);

  return (
    <>
      {settings.showHotkeyHints ? (
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          {t('hotkeys.button')}
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            ?
          </Badge>
        </Button>
      ) : null}

      {leaderKeyActive ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {t('hotkeys.pending')}
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/45 px-4 py-12 backdrop-blur-sm"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('hotkeys.title')}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <p className="text-sm font-semibold">{t('hotkeys.title')}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t('hotkeys.description')}</p>
            </div>

            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('hotkeys.searchPlaceholder')}
                aria-label={t('hotkeys.searchPlaceholder')}
              />
            </div>

            <div className="max-h-[24rem] overflow-y-auto px-3 py-3">
              {filteredGroups.length === 0 ? (
                <p className="rounded-2xl px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{t('hotkeys.empty')}</p>
              ) : (
                filteredGroups.map(([groupLabel, groupPages]) => (
                  <section key={groupLabel} className="mb-4 last:mb-0">
                    <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      {groupLabel}
                    </p>
                    <div className="space-y-1">
                      {groupPages.map((page) => (
                        <button
                          key={page.key}
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          onClick={() => {
                            router.push(page.href);
                            setOpen(false);
                          }}
                        >
                          <span className="font-medium">{t(page.translationKey)}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatShortcut(page.hotkey)}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
