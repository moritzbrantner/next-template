import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SCANNED_ROOTS = ['app', 'components', 'apps'] as const;
const FORBIDDEN_DB_IMPORTS = new Set(['@/src/db/client', '@/src/db/schema']);

// Existing app-layer DB access should move behind domain/query helpers over time.
const ALLOWED_DIRECT_DB_IMPORTS = new Set([
  'app/api/admin/audit-log/export/route.ts',
  'app/api/admin/data-studio/records/route.ts',
  'app/api/data-entry/rows/route.ts',
  'app/[locale]/(admin)/admin/audit-log/page.tsx',
]);

function listTypeScriptFiles(...roots: string[]) {
  const files: string[] = [];

  function walk(currentPath: string) {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (
        /\.(ts|tsx)$/.test(entry.name) &&
        !/\.(unit|integration)\.test\.(ts|tsx)$/.test(entry.name) &&
        !/\.e2e\.spec\.(ts|tsx)$/.test(entry.name)
      ) {
        files.push(path.relative(process.cwd(), entryPath));
      }
    }
  }

  for (const root of roots) {
    walk(path.resolve(root));
  }

  return files;
}

function readImports(filePath: string) {
  const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');
  return Array.from(
    source.matchAll(
      /(?:import|export)\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    ),
    (match) => match[1],
  );
}

describe('architecture: database boundaries', () => {
  it('prevents new app-layer direct database imports', () => {
    const violations = listTypeScriptFiles(...SCANNED_ROOTS).flatMap(
      (filePath) => {
        if (ALLOWED_DIRECT_DB_IMPORTS.has(filePath)) {
          return [];
        }

        return readImports(filePath)
          .filter((importPath) => FORBIDDEN_DB_IMPORTS.has(importPath))
          .map((importPath) => `${filePath} -> ${importPath}`);
      },
    );

    expect(violations).toEqual([]);
  });
});
