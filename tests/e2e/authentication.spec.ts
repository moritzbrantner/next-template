import { expect, test } from '@playwright/test';

import { TEST_USERS } from '@/src/testing/test-users';

const testUser = TEST_USERS.find((user) => user.email === 'user@example.com');

if (!testUser) {
  throw new Error('Expected default e2e test user to exist');
}

test.describe('authentication', () => {
  test('logs in through the UI, reaches protected pages, and logs out', async ({ page }) => {
    if (!process.env.DATABASE_URL) {
      test.skip(true, 'DATABASE_URL is required for e2e auth tests');
    }

    await page.goto('/en');

    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/api\/auth\/signin/);

    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in with Email and Password' }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole('button', { name: 'Log in' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open user menu' }).click();
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
    await page.getByRole('link', { name: 'Profile' }).click();

    await expect(page).toHaveURL('/en/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL('/en');
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });
});
