import { bench, describe } from 'vitest';

import {
  generatePublicRouteParams,
  getPublicPageNamespaces,
  resolvePublicRoute,
  withLocalePath,
  type AppManifest,
} from './index';

const manifest: AppManifest = {
  id: 'bench-app',
  siteName: 'Benchmark App',
  defaultLocaleMetadata: {
    title: 'Benchmark App',
    description: 'Benchmark fixture',
  },
  enabledFeatures: {
    'showcase.forms': true,
    'showcase.story': true,
  },
  publicPages: [
    {
      id: 'home',
      slug: '',
      kind: 'component',
      namespace: 'HomePage',
      render: () => null,
    },
    {
      id: 'forms',
      slug: 'examples/forms',
      aliases: ['forms'],
      kind: 'component',
      featureKey: 'showcase.forms',
      namespace: 'FormsPage',
      render: () => null,
    },
    {
      id: 'story',
      slug: 'examples/story',
      aliases: ['story'],
      kind: 'component',
      featureKey: 'showcase.story',
      namespace: 'StoryPage',
      render: () => null,
    },
  ],
  publicNavigation: [
    { pageId: 'home', category: 'discover', hotkey: ['alt', 'h'], order: 10 },
    { pageId: 'forms', category: 'discover', hotkey: ['alt', 'f'], order: 20 },
    { pageId: 'story', category: 'discover', hotkey: ['alt', 's'], order: 30 },
  ],
  contentRoots: {
    pages: [],
    blog: [],
    changelog: [],
  },
  loadMessages: () => ({}),
  exampleApis: {},
};
const locales = ['en', 'de', 'fr', 'es'];
const routeSlugs = ['', 'examples/forms', 'forms', 'examples/story', 'missing'];

describe('app-pack helpers', () => {
  bench('resolve public routes', () => {
    for (const slug of routeSlugs) {
      resolvePublicRoute(manifest, slug);
    }
  });

  bench('generate route params', () => {
    generatePublicRouteParams(locales, manifest);
  });

  bench('collect namespaces', () => {
    getPublicPageNamespaces(manifest);
  });

  bench('prefix localized paths', () => {
    withLocalePath('/examples/forms?tab=one', 'en');
    withLocalePath('/de/examples/story', 'de');
    withLocalePath('/forms#details', 'fr');
  });
});
