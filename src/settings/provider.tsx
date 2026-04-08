'use client';

import { createContext, startTransition, useContext, useLayoutEffect, useState, type ReactNode } from 'react';

import {
  APP_SETTINGS_STORAGE_KEY,
  applyAppSettingsToDocument,
  buildAppSettingsCookie,
  type AppSettings,
} from '@/src/settings/preferences';

type AppSettingsUpdater =
  | Partial<AppSettings>
  | ((currentSettings: AppSettings) => Partial<AppSettings>);

type AppSettingsContextValue = {
  settings: AppSettings;
  updateSettings: (nextSettings: AppSettingsUpdater) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: AppSettings;
}) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  useLayoutEffect(() => {
    applyAppSettingsToDocument(settings);
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    document.cookie = buildAppSettingsCookie(settings);
  }, [settings]);

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        updateSettings: (nextSettings) => {
          startTransition(() => {
            setSettings((currentSettings) => ({
              ...currentSettings,
              ...(typeof nextSettings === 'function' ? nextSettings(currentSettings) : nextSettings),
            }));
          });
        },
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
}
