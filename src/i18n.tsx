'use client';

import { createContext, useContext, type ReactNode } from 'react';

import deMessages from '@/messages/de';
import enMessages from '@/messages/en';
import { hasLocale, routing, type AppLocale } from '@/i18n/routing';

type Messages = typeof enMessages;
type MessageValue = string | number | boolean | null | undefined | Record<string, unknown>;

const messageCatalog = {
  en: enMessages,
  de: deMessages,
} as const satisfies Record<AppLocale, Messages>;

type I18nContextValue = {
  locale: AppLocale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function getMessages(locale: string): Messages {
  return hasLocale(locale) ? messageCatalog[locale] : messageCatalog[routing.defaultLocale];
}

function getMessageByPath(messages: Messages, key: string): MessageValue {
  return key.split('.').reduce<MessageValue>((value, segment) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment] as MessageValue;
  }, messages);
}

function formatMessage(template: string, values?: Record<string, string | number | boolean | null | undefined>) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? '' : String(value);
  });
}

export function createTranslator(locale: string, namespace?: string) {
  const messages = getMessages(locale);

  return (key: string, values?: Record<string, string | number | boolean | null | undefined>) => {
    const messageKey = namespace ? `${namespace}.${key}` : key;
    const value = getMessageByPath(messages, messageKey);

    if (typeof value !== 'string') {
      throw new Error(`Missing translation for key "${messageKey}"`);
    }

    return formatMessage(value, values);
  };
}

export function I18nProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: AppLocale;
}) {
  return <I18nContext.Provider value={{ locale, messages: getMessages(locale) }}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useLocale must be used inside I18nProvider');
  }

  return context.locale;
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslations must be used inside I18nProvider');
  }

  return (key: string, values?: Record<string, string | number | boolean | null | undefined>) => {
    const messageKey = namespace ? `${namespace}.${key}` : key;
    const value = getMessageByPath(context.messages, messageKey);

    if (typeof value !== 'string') {
      throw new Error(`Missing translation for key "${messageKey}"`);
    }

    return formatMessage(value, values);
  };
}
