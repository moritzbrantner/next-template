import { cookies } from 'next/headers';

import { parseThemeFromCookieHeader, type Theme } from '@/lib/theme';
import {
  defaultAppSettings,
  parseAppSettingsFromCookieHeader,
  type AppSettings,
} from '@/src/settings/preferences';
import { isGithubPagesBuild } from '@/src/runtime/build-target';

export type DocumentRouteContext = {
  theme: Theme;
  settings: AppSettings;
};

export const themeScript = `
(() => {
  const cookieTheme = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('theme='))
    ?.split('=')[1];
  const storedTheme = window.localStorage.getItem('theme');
  const theme = cookieTheme === 'light' || cookieTheme === 'dark'
    ? cookieTheme
    : (storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
})();
`;

export const settingsScript = `
(() => {
  const defaultSettings = ${JSON.stringify(defaultAppSettings)};
  const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const parseSettings = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  };
  const cookieSettings = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('app-settings='))
    ?.split('=')[1];
  const storedSettings = window.localStorage.getItem('app-settings');
  const parsedSettings = parseSettings(cookieSettings) ?? parseSettings(storedSettings);
  const settings = isRecord(parsedSettings)
    ? {
        ...defaultSettings,
        ...parsedSettings,
        notifications: {
          ...defaultSettings.notifications,
          ...(isRecord(parsedSettings.notifications) ? parsedSettings.notifications : {}),
        },
      }
    : defaultSettings;

  document.documentElement.dataset.background = settings.background;
  document.documentElement.dataset.density = settings.compactSpacing ? 'compact' : 'comfortable';
  document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  document.documentElement.dataset.hotkeyHints = settings.showHotkeyHints ? 'visible' : 'hidden';
})();
`;

async function getCookieHeader() {
  if (isGithubPagesBuild) {
    return '';
  }

  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

export async function loadDocumentContext(): Promise<DocumentRouteContext> {
  if (isGithubPagesBuild) {
    return {
      theme: 'light',
      settings: defaultAppSettings,
    };
  }

  const cookieHeader = await getCookieHeader();

  return {
    theme: parseThemeFromCookieHeader(cookieHeader),
    settings: parseAppSettingsFromCookieHeader(cookieHeader),
  };
}
