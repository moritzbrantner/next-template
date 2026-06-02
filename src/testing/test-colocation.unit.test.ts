import { readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const TEST_FILE_PATTERN =
  /\.(unit|integration)\.test\.(ts|tsx)$|\.e2e\.spec\.ts$/;
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.generated',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'playwright-report',
  'test-results',
]);
const APPROVED_ROOT_TESTS = new Set(['scaffold-contract.unit.test.ts']);

function listTestFiles() {
  const files: string[] = [];

  function walk(currentPath: string) {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (TEST_FILE_PATTERN.test(entry.name)) {
        files.push(path.relative(process.cwd(), entryPath));
      }
    }
  }

  walk(process.cwd());

  return files;
}

describe('test colocation', () => {
  it('keeps tests beside the closest owning app, component, package, script, or domain', () => {
    const rootLevelTests = listTestFiles().filter((filePath) => {
      return !filePath.includes(path.sep) && !APPROVED_ROOT_TESTS.has(filePath);
    });

    expect(rootLevelTests).toEqual([]);
  });
});
