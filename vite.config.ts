import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { normalizePublicBasePath, normalizeRouterBasePath } from './src/runtime/base-path';

const isGithubPagesBuild = process.env.GITHUB_PAGES === 'true';
const githubPagesBasePath = normalizePublicBasePath(
  process.env.GITHUB_PAGES_BASE_PATH ??
    (isGithubPagesBuild ? process.env.GITHUB_REPOSITORY?.split('/')[1] : undefined),
);
const githubPagesRouterBasePath = normalizeRouterBasePath(githubPagesBasePath);

export default defineConfig({
  base: isGithubPagesBuild ? githubPagesBasePath : '/',
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(
      isGithubPagesBuild
        ? {
            router: {
              basepath: githubPagesRouterBasePath,
            },
            spa: {
              enabled: true,
              prerender: {
                outputPath: '/_shell.html',
              },
            },
          }
        : undefined,
    ),
    viteReact(),
  ],
});