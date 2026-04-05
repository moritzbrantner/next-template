import { expect, test } from '@playwright/test';

import {
  getSeededUser,
  gotoAndWaitForHydration,
  loginWithCredentials,
} from '@/tests/e2e/helpers';

const managerUser = getSeededUser('manager@example.com');
const regularUser = getSeededUser('user@example.com');

test.describe('settings and hotkeys', () => {
  test('persists settings choices across reloads', async ({ page }) => {
    await loginWithCredentials(page, regularUser.email, regularUser.password);

    await gotoAndWaitForHydration(page, '/en/settings');
    await page.getByRole('tab', { name: 'Appearance' }).click();
    await page.getByRole('button', { name: /Aurora Cool cyan and green gradients\./ }).click();

    await page.getByRole('tab', { name: 'Dates' }).click();
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'ISO 8601' }).click();
    await expect(page.getByText(/\d{4}-\d{2}-\d{2}/)).toBeVisible();

    await page.getByRole('tab', { name: 'Workflow' }).click();
    await page.getByRole('switch').click();
    await expect(page.getByRole('button', { name: 'Hotkeys' })).toHaveCount(0);

    await page.reload();
    await gotoAndWaitForHydration(page, '/en/settings');

    await expect(page.locator('html')).toHaveAttribute('data-background', 'aurora');
    await expect(page.getByRole('button', { name: 'Hotkeys' })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Dates' }).click();
    await expect(page.getByText(/\d{4}-\d{2}-\d{2}/)).toBeVisible();
  });

  test('lets manager roles use hotkeys to reach admin pages', async ({ page }) => {
    await loginWithCredentials(page, managerUser.email, managerUser.password);

    await expect(page.getByRole('button', { name: 'Hotkeys' })).toBeVisible();

    await page.keyboard.press('Alt+M');
    await expect(page).toHaveURL('/en/admin');
    await expect(page.getByRole('heading', { name: 'Admin overview' })).toBeVisible();

    await page.keyboard.press('Alt+E');
    await expect(page).toHaveURL('/en/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('keeps regular users out of admin pages', async ({ page }) => {
    await loginWithCredentials(page, regularUser.email, regularUser.password);

    await gotoAndWaitForHydration(page, '/en/admin');
    await expect(page).toHaveURL('/en');
    await expect(page.getByRole('heading', { name: 'One template, multiple production-ready starting points.' })).toBeVisible();
  });
});
