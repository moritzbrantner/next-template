import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const DEPRECATED_IMPORT_PATTERNS = [
  '@features/*',
  '@stores/*',
  '@services/*',
  '@/features/*',
  '@/stores/*',
  '@/lib/services/*',
];

export default tseslint.config(
  {
    ignores: ['.next/**', 'dist/**', 'out/**', 'build/**', 'coverage/**', 'src/routeTree.gen.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['components/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: DEPRECATED_IMPORT_PATTERNS,
        },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/components/*'],
        },
      ],
    },
  },
  {
    files: ['src/db/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/components/*', '@/src/domain/*', '@/src/profile/*'],
        },
      ],
    },
  },
  {
    files: ['lib/validation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@/components/*', '@/src/*', '@features/*', '@/features/*', '@stores/*', '@/stores/*'],
        },
      ],
    },
  },
);
