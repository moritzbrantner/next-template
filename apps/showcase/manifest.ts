import { createElement } from 'react';

import type { AppManifest } from '@moritzbrantner/app-pack';

import { loadShowcaseMessages } from './messages';

const enabledFeatures = {
  'account.register': true,
  'account.passwordRecovery': true,
  'profiles.public': true,
  'profiles.follow': true,
  'profiles.blog': true,
  'people.directory': true,
  groups: true,
  notifications: true,
  newsletter: true,
  reportProblem: true,
  'content.blog': true,
  'content.changelog': true,
  'workspace.dataEntry': true,
  'admin.workspace': true,
  'admin.content': true,
  'admin.reports': true,
  'admin.users': true,
  'admin.systemSettings': true,
  'admin.dataStudio': true,
} as const;

const showcaseManifest: AppManifest = {
  id: 'showcase',
  siteName: 'Next Template',
  defaultLocaleMetadata: {
    title: 'Next Template',
    description:
      'Next.js application with auth, admin examples, and Drizzle/Postgres persistence.',
  },
  enabledFeatures,
  publicPages: [
    {
      id: 'home',
      slug: '',
      kind: 'component',
      namespace: 'HomePage',
      render: async ({ locale }) => {
        const pageModule = await import('./pages/home-page');
        const HomePage = pageModule.default;
        return createElement(HomePage, { locale });
      },
    },
    {
      id: 'about',
      slug: 'about',
      kind: 'component',
      namespace: 'AboutPage',
      render: async ({ locale }) => {
        const pageModule = await import('./pages/about-page');
        const AboutPage = pageModule.default;
        return createElement(AboutPage, { locale });
      },
    },
  ],
  publicNavigation: [
    { pageId: 'home', category: 'discover', hotkey: ['alt', 'h'], order: 10 },
    { pageId: 'about', category: 'discover', hotkey: ['alt', 'a'], order: 20 },
  ],
  contentRoots: {
    pages: ['apps/showcase/content/pages'],
    blog: ['apps/showcase/content/blog'],
    changelog: ['apps/showcase/content/changelog'],
  },
  loadMessages: loadShowcaseMessages,
  exampleApis: {},
};

export default showcaseManifest;
