import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'apps/*/tests/**/*.test.ts',
      'apps/*/tests/**/*.test.tsx',
      'packages/app-pack/tests/**/*.test.ts',
      'packages/app-pack-react/tests/**/*.test.tsx',
    ],
    setupFiles: ['./tests/vitest.setup.ts'],
  },
});
