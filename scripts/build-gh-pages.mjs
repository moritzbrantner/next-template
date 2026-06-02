import { createServer } from 'node:http';
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

import activeManifest from '../app.config.ts';
import { routing } from '../i18n/routing.ts';

const repoRoot = process.cwd();
const stashRoot = path.join(repoRoot, '.gh-pages-build-stash');
const reportOutputPath = path.join(repoRoot, '.generated', 'unlighthouse');
const reportJsonPath = path.join(reportOutputPath, 'ci-result.json');
const previewPort = Number.parseInt(
  process.env.GH_PAGES_PREVIEW_PORT ?? '4173',
  10,
);
const githubPagesBasePath = normalizeBasePath(
  process.env.GITHUB_PAGES_BASE_PATH,
);
const previewOrigin = `http://127.0.0.1:${previewPort}`;
const previewCheckUrl = `${previewOrigin}${githubPagesBasePath}/en/`;

const excludedPaths = [
  'app/api',
  'app/[locale]/(admin)',
  'app/[locale]/(guest)',
  'app/[locale]/(protected)',
  'app/[locale]/(public)/profile',
];
const extraPublicSlugs = ['blog', 'changelog', 'report-problem'];
const unlighthouseBudgets = {
  routeScore: 85,
  categories: {
    performance: 55,
    accessibility: 90,
    'best-practices': 90,
    seo: 90,
  },
};
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const renames = excludedPaths.map((relativePath) => ({
  from: path.join(repoRoot, relativePath),
  to: path.join(stashRoot, relativePath),
}));

const movedPaths = [];

function pageIsEnabled(page) {
  if (!page.featureKey) {
    return true;
  }

  return activeManifest.enabledFeatures[page.featureKey] !== false;
}

function joinRoute(locale, slug) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
  const localeRoute = normalizedSlug
    ? `/${locale}/${normalizedSlug}`
    : `/${locale}`;

  return `${githubPagesBasePath}${localeRoute}`;
}

function createScannedRoutes() {
  const publicSlugs = activeManifest.publicPages
    .filter(pageIsEnabled)
    .map((page) => page.slug);
  const routeSlugs = [...new Set([...publicSlugs, ...extraPublicSlugs])];

  return routing.locales.flatMap((locale) =>
    routeSlugs.map((slug) => joinRoute(locale, slug)),
  );
}

async function movePath(from, to) {
  try {
    await mkdir(path.dirname(to), { recursive: true });
    await rename(from, to);
    movedPaths.push({ from, to });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
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

function normalizeBasePath(value) {
  if (!value || value === '/') {
    return '';
  }

  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function stripBasePath(pathname) {
  if (!githubPagesBasePath) {
    return pathname;
  }

  if (pathname === '/' || pathname === '') {
    return '/';
  }

  if (pathname === githubPagesBasePath) {
    return '/';
  }

  if (pathname.startsWith(`${githubPagesBasePath}/`)) {
    return pathname.slice(githubPagesBasePath.length) || '/';
  }

  return null;
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

  return path.join(rootDir, '404.html');
}

function createStaticExportServer(rootDir) {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const strippedPath = stripBasePath(requestUrl.pathname);

    if (strippedPath === null) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    try {
      const filePath = await resolveStaticFile(rootDir, strippedPath);
      const contents = await readFile(filePath);
      const extension = path.extname(filePath);

      response.statusCode = filePath.endsWith('404.html') ? 404 : 200;
      response.setHeader(
        'content-type',
        mimeTypes[extension] ?? 'application/octet-stream',
      );
      response.end(contents);
    } catch (error) {
      response.statusCode = 500;
      response.end(
        error instanceof Error
          ? error.message
          : 'Failed to serve static export',
      );
    }
  });

  return {
    start: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(previewPort, '127.0.0.1', () => {
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

async function waitForStaticExport(url, timeoutMs = 60_000) {
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

  throw new Error(`Timed out waiting for static export at ${url}.`);
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('bun', ['run', 'build:app'], {
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

      reject(
        new Error(
          `gh-pages app build failed with code ${code ?? 'null'} and signal ${signal ?? 'null'}`,
        ),
      );
    });

    child.on('error', reject);
  });
}

function runUnlighthouse() {
  const scannedRoutes = createScannedRoutes();

  return new Promise((resolve, reject) => {
    const child = spawn(
      'bun',
      [
        'x',
        'unlighthouse-ci',
        '--site',
        previewOrigin,
        '--reporter',
        'jsonExpanded',
        '--output-path',
        reportOutputPath,
        '--disable-robots-txt',
        '--disable-sitemap',
        '--disable-dynamic-sampling',
        '--urls',
        scannedRoutes.join(','),
      ],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
      },
    );

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `unlighthouse scan failed with code ${code ?? 'null'} and signal ${signal ?? 'null'}`,
        ),
      );
    });

    child.on('error', reject);
  });
}

function formatScore(score) {
  return `${Math.round(score * 100)}%`;
}

async function assertUnlighthouseBudgets() {
  const report = JSON.parse(await readFile(reportJsonPath, 'utf8'));
  const failures = [];

  for (const route of report.routes ?? []) {
    if ((route.score ?? 0) * 100 < unlighthouseBudgets.routeScore) {
      failures.push(
        `${route.path}: overall ${formatScore(route.score ?? 0)} < ${unlighthouseBudgets.routeScore}%`,
      );
    }

    for (const [category, minimumScore] of Object.entries(
      unlighthouseBudgets.categories,
    )) {
      const score = route.categories?.[category]?.score ?? 0;

      if (score * 100 < minimumScore) {
        failures.push(
          `${route.path}: ${category} ${formatScore(score)} < ${minimumScore}%`,
        );
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        'Unlighthouse budgets failed:',
        ...failures.slice(0, 25).map((failure) => `- ${failure}`),
        failures.length > 25
          ? `- ${failures.length - 25} additional failures omitted`
          : null,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  console.log(
    [
      `Unlighthouse budgets passed for ${report.routes?.length ?? 0} route(s).`,
      `overall >= ${unlighthouseBudgets.routeScore}%`,
      ...Object.entries(unlighthouseBudgets.categories).map(
        ([category, minimumScore]) => `${category} >= ${minimumScore}%`,
      ),
    ].join(' '),
  );
}

let staticServer;

try {
  for (const { from, to } of renames) {
    await movePath(from, to);
  }

  await rm(reportOutputPath, { force: true, recursive: true });
  await runNextBuild();
  staticServer = createStaticExportServer(path.join(repoRoot, 'out'));
  await staticServer.start();
  await waitForStaticExport(previewCheckUrl);
  await runUnlighthouse();
  await assertUnlighthouseBudgets();
  await staticServer.stop();
  staticServer = null;
  await runNextBuild();
} finally {
  if (staticServer) {
    await staticServer.stop();
  }

  await restoreMovedPaths();
}
