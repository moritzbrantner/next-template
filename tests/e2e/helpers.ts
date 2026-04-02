import { expect, type Page } from '@playwright/test';

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
