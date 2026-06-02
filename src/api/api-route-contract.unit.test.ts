import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const HTTP_METHOD_EXPORT_PATTERN =
  /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/;
const ALLOWED_SKIP_ORIGIN_CHECK_ROUTES = new Set<string>([]);

function listApiRouteFiles() {
  return execFileSync('git', ['ls-files', 'app/api/**/route.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter((filePath) => existsSync(path.join(process.cwd(), filePath)));
}

describe('api route contract', () => {
  it('keeps API routes behind the shared route wrapper', () => {
    const violations = listApiRouteFiles().flatMap((filePath) => {
      const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');

      return source.includes("from '@/src/http/route'") &&
        source.includes('createApiRoute')
        ? []
        : [filePath];
    });

    expect(violations).toEqual([]);
  });

  it('requires explicit allowlisting for origin-check skips', () => {
    const violations = listApiRouteFiles().filter((filePath) => {
      if (ALLOWED_SKIP_ORIGIN_CHECK_ROUTES.has(filePath)) {
        return false;
      }

      const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');
      return source.includes('skipOriginCheck: true');
    });

    expect(violations).toEqual([]);
  });

  it('exports at least one HTTP method from every route file', () => {
    const violations = listApiRouteFiles().filter((filePath) => {
      const source = readFileSync(path.join(process.cwd(), filePath), 'utf8');
      return !HTTP_METHOD_EXPORT_PATTERN.test(source);
    });

    expect(violations).toEqual([]);
  });
});
