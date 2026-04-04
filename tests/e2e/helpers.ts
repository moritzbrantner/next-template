import { expect, type Page } from '@playwright/test';

import { TEST_USERS } from '@/src/testing/test-users';

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
