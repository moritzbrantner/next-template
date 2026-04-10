import deMessages from '@/messages/de';
import enMessages from '@/messages/en';
import { hasLocale, routing, type AppLocale } from '@/i18n/routing';

export type Messages = typeof enMessages;
type MessageValue = string | number | boolean | null | undefined | Record<string, unknown>;

const messageCatalog = {
  en: enMessages,
  de: deMessages,
} as const satisfies Record<AppLocale, Messages>;

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
