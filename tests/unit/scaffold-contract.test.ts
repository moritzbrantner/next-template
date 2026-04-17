import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { appManifest } from '../../app.manifest';
import showcaseManifest from '../../apps/showcase/manifest';

describe('scaffold-v2 contract', () => {
  it('exposes a standalone root app manifest without replacing the internal app-pack seam', () => {
    expect(appManifest).toMatchObject({
      appId: 'web',
      slug: 'web',
      displayName: 'Web',
      platform: 'web',
      packageName: 'next-template',
      entryWorkspace: '.',
      releaseCadence: 'independent',
      sharedPackages: ['@moritzbrantner/ui', '@moritzbrantner/storytelling'],
      deployment: {
        runtime: 'nextjs',
        output: '.next',
      },
    });

    expect(showcaseManifest.id).toBe('showcase');
    expect(showcaseManifest.publicPages.length).toBeGreaterThan(0);
    expect(showcaseManifest.publicNavigation.length).toBeGreaterThan(0);
  });

  it('uses platform-packages for shared runtime dependencies and keeps only the app-pack seam local', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      workspaces: string[];
      dependencies: Record<string, string>;
    };

    expect(packageJson.workspaces).toEqual([
      'packages/app-pack',
      'packages/app-pack-react',
    ]);
    expect(packageJson.dependencies['@moritzbrantner/ui']).toBe(
      'file:../platform-packages/packages/ui',
    );
    expect(packageJson.dependencies['@moritzbrantner/storytelling']).toBe(
      'file:../platform-packages/packages/storytelling',
    );
    expect(packageJson).toMatchObject({
      overrides: {
        '@moritzbrantner/ui': 'file:../platform-packages/packages/ui',
      },
    });
  });

  it('removes subtree-sync guidance and workflow hooks from the public contract', () => {
    const updateGuide = readFileSync(
      path.join(process.cwd(), 'docs/updating-from-upstream.md'),
      'utf8',
    );
    const readme = readFileSync(path.join(process.cwd(), 'README.md'), 'utf8');

    expect(updateGuide).toContain('This repo no longer assumes subtree sync');
    expect(updateGuide).toContain('@moritzbrantner/platform-upgrader');
    expect(readme).toContain('app.manifest.ts');
    expect(existsSync(path.join(process.cwd(), '.github/workflows/notify-monorepo-subtree-sync.yml'))).toBe(false);
  });
});
