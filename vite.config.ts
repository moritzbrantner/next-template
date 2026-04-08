import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function normalizeBasePath(value: string | undefined) {
  if (!value || value === '/') {
    return '/';
  }

  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}

const isGithubPagesBuild = process.env.GITHUB_PAGES === 'true';
const githubPagesBasePath = normalizeBasePath(
  process.env.GITHUB_PAGES_BASE_PATH ??
    (isGithubPagesBuild ? process.env.GITHUB_REPOSITORY?.split('/')[1] : undefined),
);

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
            spa: {
              enabled: true,
              prerender: {
                outputPath: '/index.html',
              },
            },
          }
        : undefined,
    ),
    viteReact(),
  ],
});
