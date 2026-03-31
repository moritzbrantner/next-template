// tests/e2e/global-teardown.ts
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const teardownFile = fileURLToPath(import.meta.url);
const teardownDir = path.dirname(teardownFile);

export default async function globalTeardown() {
  execFileSync('node', ['-e', 'process.exit(0)'], {
    cwd: path.resolve(teardownDir, '../..'),
    stdio: 'inherit',
  });
}