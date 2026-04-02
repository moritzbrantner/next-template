import { createServer } from 'node:http';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

import serverEntry from '../dist/server/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const clientRoot = path.join(appRoot, 'dist/client');

const args = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const current = process.argv[index];

  if (!current.startsWith('--')) {
    continue;
  }

  const [key, inlineValue] = current.slice(2).split('=');
  const nextValue = inlineValue ?? process.argv[index + 1];

  if (inlineValue === undefined && nextValue && !nextValue.startsWith('--')) {
    args.set(key, nextValue);
    index += 1;
    continue;
  }

  args.set(key, inlineValue ?? 'true');
}

const host = args.get('host') ?? process.env.HOST ?? '0.0.0.0';
const port = Number(args.get('port') ?? process.env.PORT ?? '3000');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

async function resolveStaticAsset(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const absolutePath = path.join(clientRoot, path.normalize(normalizedPath));
  const relativePath = path.relative(clientRoot, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  try {
    const fileStats = await stat(absolutePath);

    if (!fileStats.isFile()) {
      return null;
    }

    return absolutePath;
  } catch {
    return null;
  }
}

async function writeStaticResponse(res, filePath, method) {
  const extension = path.extname(filePath);
  const contentType = contentTypes.get(extension) ?? 'application/octet-stream';
  const fileStats = await stat(filePath);

  res.statusCode = 200;
  res.setHeader('content-type', contentType);
  res.setHeader('content-length', String(fileStats.size));

  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('cache-control', 'public, max-age=31536000, immutable');
  }

  if (method === 'HEAD') {
    res.end();
    return;
  }

  res.end(await readFile(filePath));
}

async function writeFetchResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  Readable.fromWeb(response.body).pipe(res);
}

function createRequest(req) {
  const origin = `http://${req.headers.host ?? `${host}:${port}`}`;
  const url = new URL(req.url ?? '/', origin);

  const init = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }

  return { url, request: new Request(url, init) };
}

const server = createServer(async (req, res) => {
  try {
    const { url, request } = createRequest(req);
    const staticAssetPath = await resolveStaticAsset(url.pathname);

    if (staticAssetPath) {
      await writeStaticResponse(res, staticAssetPath, req.method ?? 'GET');
      return;
    }

    const response = await serverEntry.fetch(request);
    await writeFetchResponse(res, response);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(error instanceof Error ? error.stack ?? error.message : 'Unknown server error');
  }
});

await access(clientRoot);

server.listen(port, host, () => {
  console.log(`prod-server listening on http://${host}:${port}`);
});
