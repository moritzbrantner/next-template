import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import showcaseManifest from '@/apps/showcase/manifest';
import { routing } from '@/i18n/routing';

describe('showcase content roots contract', () => {
  it('points every configured content root at real locale directories', () => {
    for (const roots of Object.values(showcaseManifest.contentRoots)) {
      for (const root of roots) {
        const absoluteRoot = path.join(process.cwd(), root);
        expect(existsSync(absoluteRoot)).toBe(true);

        for (const locale of routing.locales) {
          expect(existsSync(path.join(absoluteRoot, locale))).toBe(true);
        }
      }
    }
  });
});
