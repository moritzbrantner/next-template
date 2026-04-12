import { rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();
const reportOutputPath = path.join(repoRoot, '.generated', 'unlighthouse');
const stagingPort = Number.parseInt(process.env.STAGING_PREVIEW_PORT ?? '3100', 10);
const stagingSiteUrl = `http://127.0.0.1:${stagingPort}`;
const stagingRoutes = [
  '/en',
  '/de',
  '/en/about',
  '/de/about',
  '/en/blog',
  '/de/blog',
  '/en/changelog',
  '/de/changelog',
  '/en/remocn',
  '/de/remocn',
  '/en/report-problem',
  '/de/report-problem',
  '/en/forms',
  '/de/forms',
  '/en/story',
  '/de/story',
  '/en/communication',
  '/de/communication',
  '/en/table',
  '/de/table',
  '/en/uploads',
  '/de/uploads',
  '/en/examples/forms',
  '/de/examples/forms',
  '/en/examples/story',
  '/de/examples/story',
  '/en/examples/communication',
  '/de/examples/communication',
  '/en/examples/uploads',
  '/de/examples/uploads',
];

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_DEPLOY_TARGET: 'staging',
        ...options.env,
      },
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with code ${code ?? 'null'} and signal ${signal ?? 'null'}`));
    });

    child.on('error', reject);
  });
}

function startServer() {
  return spawn('pnpm', ['exec', 'next', 'start', '--hostname', '127.0.0.1', '--port', String(stagingPort)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DEPLOY_TARGET: 'staging',
    },
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for staging server at ${url}.`);
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }

      resolve();
    }, 5_000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

let server;

try {
  await rm(reportOutputPath, { recursive: true, force: true });
  await runCommand('pnpm', ['exec', 'next', 'build']);

  server = startServer();
  await waitForServer(`${stagingSiteUrl}/api/health/live`);

  await runCommand('pnpm', [
    'exec',
    'unlighthouse-ci',
    '--site',
    stagingSiteUrl,
    '--reporter',
    'jsonExpanded',
    '--output-path',
    reportOutputPath,
    '--disable-robots-txt',
    '--disable-sitemap',
    '--disable-dynamic-sampling',
    '--urls',
    stagingRoutes.join(','),
  ]);
} finally {
  await stopServer(server);
}
