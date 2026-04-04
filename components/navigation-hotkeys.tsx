'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@moritzbrantner/ui';

import { useRouter } from '@/i18n/navigation';
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

  const pages = useMemo(
    () =>
      getVisibleAppPages({
        isAuthenticated: Boolean(session?.user?.id),
        role: session?.user?.role,
      }),
    [session?.user?.id, session?.user?.role],
  );

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
      if (isTypingTarget(event.target)) {
        return;
      }

      if ((event.key === '?' && !event.metaKey && !event.ctrlKey) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        setOpen((currentOpenState) => !currentOpenState);
        clearLeader();
        return;
      }

      if (event.key === 'Escape') {
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
  }, [leaderKeyActive, pages, router]);

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

      <CommandDialog open={open} onOpenChange={setOpen} title={t('hotkeys.title')} description={t('hotkeys.description')}>
        <CommandInput placeholder={t('hotkeys.searchPlaceholder')} />
        <CommandList>
          <CommandEmpty>{t('hotkeys.empty')}</CommandEmpty>
          {Object.entries(groupedPages).map(([groupLabel, groupPages]) => (
            <CommandGroup key={groupLabel} heading={groupLabel}>
              {groupPages.map((page) => (
                <CommandItem
                  key={page.key}
                  value={`${groupLabel} ${t(page.translationKey)}`}
                  onSelect={() => {
                    router.push(page.href);
                    setOpen(false);
                  }}
                >
                  <span>{t(page.translationKey)}</span>
                  <CommandShortcut>{formatShortcut(page.hotkey)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
