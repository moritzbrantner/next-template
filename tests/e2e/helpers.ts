import { expect, type Page } from '@playwright/test';

import { TEST_USERS } from '@/src/testing/test-users';

const DEFAULT_MAILPIT_BASE_URL = 'http://127.0.0.1:8025';

export async function waitForAppHydration(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.appHydrated === 'true');
}

export async function gotoAndWaitForHydration(page: Page, path: string) {
  await page.goto(path);
  await waitForAppHydration(page);
}

export async function expectStatusMessage(page: Page, text: string) {
  await expect(page.getByRole('status')).toContainText(text);
}

export function getSeededUser(email: string) {
  const user = TEST_USERS.find((testUser) => testUser.email === email);

  if (!user) {
    throw new Error(`Expected seeded test user for ${email}`);
  }

  return user;
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await gotoAndWaitForHydration(page, '/en/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/en/profile');
  await waitForAppHydration(page);
}

export async function logoutFromProfileMenu(page: Page) {
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/en');
  await waitForAppHydration(page);
}

function getMailpitBaseURL() {
  return process.env.MAILPIT_BASE_URL ?? DEFAULT_MAILPIT_BASE_URL;
}

function getMessageList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.messages)) {
      return record.messages;
    }

    if (Array.isArray(record.Messages)) {
      return record.Messages;
    }
  }

  return [];
}

function getMessageId(message: unknown) {
  if (!message || typeof message !== 'object') {
    return '';
  }

  const record = message as Record<string, unknown>;
  return typeof record.ID === 'string' ? record.ID : typeof record.id === 'string' ? record.id : '';
}

function messageMatches(message: unknown, input: { to: string; subject: string }) {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const record = message as Record<string, unknown>;
  const subject = typeof record.Subject === 'string' ? record.Subject : typeof record.subject === 'string' ? record.subject : '';
  const recipients = Array.isArray(record.To) ? record.To : Array.isArray(record.to) ? record.to : [];

  const hasRecipient = recipients.some((recipient) => {
    if (!recipient || typeof recipient !== 'object') {
      return false;
    }

    const recipientRecord = recipient as Record<string, unknown>;
    return recipientRecord.Address === input.to || recipientRecord.address === input.to;
  });

  return hasRecipient && subject === input.subject;
}

async function getMailpitMessageRaw(messageId: string) {
  const response = await fetch(`${getMailpitBaseURL()}/api/v1/message/${messageId}/raw`);

  if (!response.ok) {
    throw new Error(`Unable to fetch Mailpit message ${messageId}.`);
  }

  return response.text();
}

export async function clearMailpitMessages() {
  const response = await fetch(`${getMailpitBaseURL()}/api/v1/messages`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Unable to clear Mailpit messages.');
  }
}

export async function waitForMailpitMessage(input: { to: string; subject: string; timeoutMs?: number }) {
  const timeoutMs = input.timeoutMs ?? 15_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const response = await fetch(`${getMailpitBaseURL()}/api/v1/messages?limit=25`);

    if (!response.ok) {
      throw new Error('Unable to list Mailpit messages.');
    }

    const payload = (await response.json()) as unknown;
    const messages = getMessageList(payload);

    for (const message of messages) {
      const messageId = getMessageId(message);

      if (!messageId) {
        continue;
      }

      if (messageMatches(message, input)) {
        const raw = await getMailpitMessageRaw(messageId);
        return { id: messageId, raw };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Mailpit message "${input.subject}" to ${input.to}.`);
}

export function extractFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"')]+/);

  if (!match) {
    throw new Error('Expected at least one URL in message content.');
  }

  return match[0];
}
