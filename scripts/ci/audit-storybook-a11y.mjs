import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { source as axeSource } from 'axe-core';

const repoRoot = process.cwd();
const storybookOutputPath = path.join(repoRoot, 'storybook-static');
let port = Number.parseInt(process.env.STORYBOOK_A11Y_PORT ?? '6106', 10);
let origin = `http://127.0.0.1:${port}`;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function checkPort(candidatePort) {
  const server = createServer();

  return new Promise((resolve) => {
    server.once('error', () => resolve(false));
    server.listen(candidatePort, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

async function resolvePort() {
  if (process.env.STORYBOOK_A11Y_PORT) {
    return port;
  }

  for (
    let candidatePort = port;
    candidatePort < port + 100;
    candidatePort += 1
  ) {
    if (await checkPort(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(`No available Storybook a11y port found from ${port}.`);
}

async function resolveStaticFile(rootDir, pathname) {
  const relativePath = pathname.replace(/^\/+/, '');
  const candidates = [];

  if (!relativePath) {
    candidates.push('index.html');
  } else {
    candidates.push(relativePath);

    if (!path.extname(relativePath)) {
      candidates.push(path.join(relativePath, 'index.html'));
      candidates.push(`${relativePath}.html`);
    }
  }

  for (const candidate of candidates) {
    const absolutePath = path.join(rootDir, candidate);

    if (!absolutePath.startsWith(rootDir)) {
      continue;
    }

    try {
      const fileStat = await stat(absolutePath);

      if (fileStat.isFile()) {
        return absolutePath;
      }
    } catch {}
  }

  return path.join(rootDir, 'index.html');
}

function createStaticServer(rootDir) {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', origin);

    try {
      const filePath = await resolveStaticFile(rootDir, requestUrl.pathname);
      const contents = await readFile(filePath);
      const extension = path.extname(filePath);

      response.statusCode = 200;
      response.setHeader(
        'content-type',
        mimeTypes[extension] ?? 'application/octet-stream',
      );
      response.end(contents);
    } catch (error) {
      response.statusCode = 500;
      response.end(
        error instanceof Error ? error.message : 'Failed to serve Storybook',
      );
    }
  });

  return {
    start: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
          server.off('error', reject);
          resolve();
        });
      }),
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}

async function waitForStorybook(timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(origin);

      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for Storybook at ${origin}.`);
}

async function loadStories() {
  const index = JSON.parse(
    await readFile(path.join(storybookOutputPath, 'index.json'), 'utf8'),
  );

  return Object.values(index.entries ?? {})
    .filter((entry) => entry.type === 'story')
    .sort((left, right) => left.id.localeCompare(right.id));
}

function formatViolation(story, violation) {
  const targets = violation.nodes
    .slice(0, 3)
    .flatMap((node) => node.target)
    .join(', ');

  return [
    `${story.title} / ${story.name}: ${violation.id}`,
    `${violation.help} (${violation.impact ?? 'unknown'} impact)`,
    targets ? `Targets: ${targets}` : null,
  ]
    .filter(Boolean)
    .join('\n  ');
}

async function auditStories() {
  const stories = await loadStories();
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHROME_CHANNEL ?? 'chrome',
    headless: true,
  });
  const page = await browser.newPage();
  const failures = [];

  try {
    for (const story of stories) {
      const storyUrl = `${origin}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;

      await page.goto(storyUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('#storybook-root', { state: 'attached' });
      await page.addScriptTag({ content: axeSource });

      const result = await page.evaluate(async () => {
        return window.axe.run('#storybook-root', {
          resultTypes: ['violations'],
        });
      });

      for (const violation of result.violations) {
        failures.push(formatViolation(story, violation));
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    throw new Error(
      [
        `Storybook a11y audit failed with ${failures.length} violation(s):`,
        ...failures.slice(0, 25).map((failure) => `- ${failure}`),
        failures.length > 25
          ? `- ${failures.length - 25} additional violations omitted`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  console.log(`Storybook a11y audit passed for ${stories.length} story(s).`);
}

port = await resolvePort();
origin = `http://127.0.0.1:${port}`;

const staticServer = createStaticServer(storybookOutputPath);
let staticServerStarted = false;

try {
  await staticServer.start();
  staticServerStarted = true;
  await waitForStorybook();
  await auditStories();
} finally {
  if (staticServerStarted) {
    await staticServer.stop();
  }
}
