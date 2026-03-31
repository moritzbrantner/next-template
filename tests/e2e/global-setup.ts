// tests/e2e/global-setup.ts
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyE2EEnvironment } from '@/tests/e2e/environment';

const setupFile = fileURLToPath(import.meta.url);
const setupDir = path.dirname(setupFile);

export default async function globalSetup() {
  applyE2EEnvironment();

  execFileSync('pnpm', ['exec', 'playwright', 'install', '--with-deps'], {
    cwd: path.resolve(setupDir, '../..'),
    stdio: 'inherit',
  });
}