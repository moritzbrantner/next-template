import deMessages from '@/messages/de';
import enMessages from '@/messages/en';
import { hasLocale, routing, type AppLocale } from '@/i18n/routing';

export type Messages = typeof enMessages;
export type MessageNamespace = keyof Messages;
export type PartialMessages = Partial<Messages>;
type MessageValue = string | number | boolean | null | undefined | Record<string, unknown>;

const messageCatalog = {
  en: enMessages,
  de: deMessages,
} as const satisfies Record<AppLocale, Messages>;

function getLocaleMessages(locale: string): Messages {
  return hasLocale(locale) ? messageCatalog[locale] : messageCatalog[routing.defaultLocale];
}

export function getMessages(locale: string, namespaces?: readonly MessageNamespace[]): PartialMessages {
  const messages = getLocaleMessages(locale);

  if (!namespaces) {
    return messages;
  }

  return Object.fromEntries(namespaces.map((namespace) => [namespace, messages[namespace]])) as PartialMessages;
}

function getMessageByPath(messages: PartialMessages, key: string): MessageValue {
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
  const messages = getLocaleMessages(locale);

  return (key: string, values?: Record<string, string | number | boolean | null | undefined>) => {
    const messageKey = namespace ? `${namespace}.${key}` : key;
    const value = getMessageByPath(messages, messageKey);

    if (typeof value !== 'string') {
      throw new Error(`Missing translation for key "${messageKey}"`);
    }

    return formatMessage(value, values);
  };
}
