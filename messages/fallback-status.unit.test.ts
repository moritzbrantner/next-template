import { describe, expect, it } from 'vitest';

import enMessages from './en';
import esMessages, { esEnglishFallbackNamespaces } from './es';
import frMessages, { frEnglishFallbackNamespaces } from './fr';

type MessageTree = Record<string, unknown>;

function countLeafMessages(value: unknown): number {
  if (typeof value === 'string') {
    return 1;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  return Object.values(value).reduce(
    (total, child) => total + countLeafMessages(child),
    0,
  );
}

describe('locale fallback status', () => {
  it.each([
    {
      locale: 'es',
      messages: esMessages as MessageTree,
      namespaces: esEnglishFallbackNamespaces,
    },
    {
      locale: 'fr',
      messages: frMessages as MessageTree,
      namespaces: frEnglishFallbackNamespaces,
    },
  ])(
    'reports English fallback namespaces for $locale',
    ({ messages, namespaces }) => {
      const fallbackCounts = Object.fromEntries(
        namespaces.map((namespace) => [
          namespace,
          countLeafMessages(messages[namespace]),
        ]),
      );

      expect(fallbackCounts).toMatchInlineSnapshot(`
        {
          "AdminPage": 285,
          "AuthPages": 104,
          "BlogPage": 39,
          "DataEntryPage": 20,
          "GroupsPage": 81,
          "NotificationsPage": 14,
          "PeoplePage": 30,
          "ProfileChatPage": 30,
          "ProfilePage": 59,
          "ReportProblemPage": 35,
          "SettingsPage": 140,
          "ThemeToggle": 5,
          "UnlighthousePage": 16,
        }
      `);

      for (const namespace of namespaces) {
        expect(messages[namespace]).toBe(
          (enMessages as MessageTree)[namespace],
        );
      }
    },
  );
});
