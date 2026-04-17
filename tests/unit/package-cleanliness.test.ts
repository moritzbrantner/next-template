import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('workspace package cleanliness', () => {
  it('does not track stale vendored package artifacts', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    ) as { workspaces: string[] };
    const activePackages = packageJson.workspaces.filter((workspace) =>
      workspace.startsWith('packages/'),
    );
    const trackedFiles = execFileSync('git', ['ls-files', 'packages'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .filter((filePath) =>
        activePackages.some((workspace) => filePath.startsWith(`${workspace}/`)),
      );

    const forbiddenTrackedFiles = trackedFiles.filter((filePath) => {
      return filePath.endsWith('.tgz') || filePath.includes('/dist/') || filePath.includes('/.turbo/');
    });

    expect(forbiddenTrackedFiles).toEqual([]);
  });
});
