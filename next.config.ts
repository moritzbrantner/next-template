import type { NextConfig } from 'next';

import { normalizeRouterBasePath } from './src/runtime/base-path';

const allowedDevOrigins = [
  'http://127.0.0.1:3005',
  'http://localhost:3005',
  'http://127.0.0.1',
  'http://localhost',
  '127.0.0.1',
  'localhost',
] as const;

const githubPagesBasePath = normalizeRouterBasePath(process.env.GITHUB_PAGES_BASE_PATH);

export const normalNextConfig: NextConfig = {
  allowedDevOrigins: [
    ...allowedDevOrigins,
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export const githubPagesNextConfig: NextConfig = {
  allowedDevOrigins: [
    ...allowedDevOrigins,
  ],
  assetPrefix: githubPagesBasePath === '/' ? undefined : githubPagesBasePath,
  basePath: githubPagesBasePath === '/' ? undefined : githubPagesBasePath,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
};

const nextConfig =
  process.env.NEXT_DEPLOY_TARGET === 'gh-pages'
    ? githubPagesNextConfig
    : normalNextConfig;

export default nextConfig;
