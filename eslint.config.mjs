import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.generated/**',
      '.next/**',
      'coverage/**',
      'db-schema.json',
      'dist/**',
      'drizzle/meta/**',
      'next-env.d.ts',
      'node_modules/**',
      'out/**',
      'packages/*/dist/**',
      'playwright-report/**',
      'storybook-static/**',
      'test-results/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['**/*.unit.test.{ts,tsx}', '**/*.integration.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
