export type NavigationLinkKey =
  | 'home'
  | 'about'
  | 'forms'
  | 'story'
  | 'communication'
  | 'table'
  | 'uploads'
  | 'dataEntry'
  | 'admin';

export type NavigationCategoryKey = 'discover' | 'workspace' | 'admin';

type NavigationVisibility = 'public' | 'authenticated' | 'admin';

type NavigationLinkDefinition = {
  href: string;
  key: NavigationLinkKey;
  visibility?: NavigationVisibility;
};

type NavigationCategoryDefinition = {
  key: NavigationCategoryKey;
  links: readonly NavigationLinkDefinition[];
};

export type NavigationCategory = {
  key: NavigationCategoryKey;
  links: readonly NavigationLinkDefinition[];
};

const navigationCategoryDefinitions = [
  {
    key: 'discover',
    links: [
      { href: '/', key: 'home' },
      { href: '/about', key: 'about' },
      { href: '/story', key: 'story' },
      { href: '/communication', key: 'communication' },
    ],
  },
  {
    key: 'workspace',
    links: [
      { href: '/forms', key: 'forms' },
      { href: '/table', key: 'table' },
      { href: '/uploads', key: 'uploads' },
      { href: '/data-entry', key: 'dataEntry', visibility: 'authenticated' },
    ],
  },
  {
    key: 'admin',
    links: [{ href: '/admin', key: 'admin', visibility: 'admin' }],
  },
] as const satisfies readonly NavigationCategoryDefinition[];

function isLinkVisible(
  link: NavigationLinkDefinition,
  { isAuthenticated, isAdmin }: { isAuthenticated: boolean; isAdmin: boolean },
) {
  if (link.visibility === 'admin') {
    return isAdmin;
  }

  if (link.visibility === 'authenticated') {
    return isAuthenticated;
  }

  return true;
}

export function buildNavigationCategories({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}): NavigationCategory[] {
  return navigationCategoryDefinitions.flatMap((category) => {
    const links = category.links.filter((link) => isLinkVisible(link, { isAuthenticated, isAdmin }));

    if (!links.length) {
      return [];
    }

    return [{ key: category.key, links }];
  });
}
