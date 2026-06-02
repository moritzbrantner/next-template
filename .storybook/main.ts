import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../{app,components,src,apps,packages}/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
};

export default config;
