import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { THEME_STORAGE_KEY, isTheme, parseThemeFromCookieHeader, type Theme } from '@/lib/theme';
import {
  APP_SETTINGS_STORAGE_KEY,
  defaultAppSettings,
  parseAppSettings,
  parseAppSettingsFromCookieHeader,
  type AppSettings,
} from '@/src/settings/preferences';

export type DocumentRouteContext = {
  theme: Theme;
  settings: AppSettings;
};

export const isGithubPagesBuild = import.meta.env.VITE_GITHUB_PAGES === 'true';

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

export const loadDocumentContext = createServerFn({ method: 'GET' }).handler((): DocumentRouteContext => {
  const request = getRequest();
  const cookieHeader = request.headers.get('cookie');

  return {
    theme: parseThemeFromCookieHeader(cookieHeader),
    settings: parseAppSettingsFromCookieHeader(cookieHeader),
  };
});

export function loadStaticDocumentContext(): DocumentRouteContext {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      theme: 'light',
      settings: defaultAppSettings,
    };
  }

  const cookieTheme = parseThemeFromCookieHeader(document.cookie);
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const theme = cookieTheme !== 'light' || !isTheme(storedTheme) ? cookieTheme : storedTheme;
  const cookieSettings = parseAppSettingsFromCookieHeader(document.cookie);
  const storedSettings = parseAppSettings(window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY));
  const hasStoredSettings = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY) !== null;

  return {
    theme,
    settings: hasStoredSettings ? storedSettings : cookieSettings,
  };
}
