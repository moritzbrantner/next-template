import { describe, expect, it } from 'vitest';

import {
  resolveEnabledPublicRoute,
  resolvePublicRoute,
} from '@moritzbrantner/app-pack';

import showcaseManifest from '@/apps/showcase/manifest';

const supportedLocales = ['en', 'de', 'fr', 'es'] as const;

function slugToSegments(slug: string) {
  return slug.length > 0 ? slug.split('/') : undefined;
}

describe('showcase manifest contract', () => {
  it('keeps navigation entries aligned with declared public pages', () => {
    const publicPageIds = new Set(
      showcaseManifest.publicPages.map((page) => page.id),
    );

    expect(
      showcaseManifest.publicNavigation
        .map((item) => item.pageId)
        .every((pageId) => publicPageIds.has(pageId)),
    ).toBe(true);
  });

  it('resolves each canonical public page slug through the manifest', () => {
    for (const page of showcaseManifest.publicPages) {
      const resolved = resolvePublicRoute(
        showcaseManifest,
        slugToSegments(page.slug),
      );
      expect(resolved?.page.id).toBe(page.id);
    }
  });

  it('keeps temporary showcase routes unregistered', () => {
    expect(showcaseManifest.publicPages.map((page) => page.id)).toEqual([
      'home',
      'about',
    ]);

    for (const slug of [
      ['remocn'],
      ['forms'],
      ['story'],
      ['communication'],
      ['chat'],
      ['table'],
      ['examples', 'forms'],
      ['examples', 'story'],
      ['examples', 'communication'],
      ['examples', 'chat'],
    ]) {
      expect(resolveEnabledPublicRoute(showcaseManifest, slug)).toBeNull();
    }
  });

  it('does not expose temporary showcase API routes', async () => {
    expect(showcaseManifest.exampleApis).toEqual({});
  });

  it('supports every configured locale', () => {
    for (const locale of supportedLocales) {
      const messages = showcaseManifest.loadMessages(locale);
      expect(messages.NavigationBar).toBeDefined();
    }
  });
});
