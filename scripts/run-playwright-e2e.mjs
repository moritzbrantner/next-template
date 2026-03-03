#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const project = process.argv[2] ?? 'desktop';
const hasPlaywright = spawnSync('pnpm', ['exec', 'playwright', '--version'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
}).status === 0;

if (!hasPlaywright) {
  console.log(`[test:e2e] Playwright is not installed in this environment. Skipping ${project} e2e run.`);
  process.exit(0);
}

const result = spawnSync(
  'pnpm',
  ['exec', 'playwright', 'test', '--config', 'playwright.config.ts', '--project', project],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

process.exit(result.status ?? 1);
