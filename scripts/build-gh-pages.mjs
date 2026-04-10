import { mkdir, rename, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();
const stashRoot = path.join(repoRoot, '.gh-pages-build-stash');

const excludedPaths = [
  'app/api',
  'app/[locale]/(admin)',
  'app/[locale]/(protected)',
  'app/[locale]/(public)/profile',
];

const renames = excludedPaths.map((relativePath) => ({
  from: path.join(repoRoot, relativePath),
  to: path.join(stashRoot, relativePath),
}));

const movedPaths = [];

async function movePath(from, to) {
  try {
    await mkdir(path.dirname(to), { recursive: true });
    await rename(from, to);
    movedPaths.push({ from, to });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

async function restoreMovedPaths() {
  while (movedPaths.length) {
    const { from, to } = movedPaths.pop();
    await mkdir(path.dirname(from), { recursive: true });
    await rename(to, from);
  }

  await rm(stashRoot, { force: true, recursive: true });
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'next', 'build'], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_DEPLOY_TARGET: 'gh-pages',
      },
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`gh-pages build failed with code ${code ?? 'null'} and signal ${signal ?? 'null'}`));
    });

    child.on('error', reject);
  });
}

try {
  for (const { from, to } of renames) {
    await movePath(from, to);
  }

  await runNextBuild();
} finally {
  await restoreMovedPaths();
}
