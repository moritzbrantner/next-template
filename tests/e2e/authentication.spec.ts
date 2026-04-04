import { expect, test } from '@playwright/test';

import {
  getSeededUser,
  gotoAndWaitForHydration,
  loginWithCredentials,
  logoutFromProfileMenu,
} from '@/tests/e2e/helpers';

const seededUser = getSeededUser('user@example.com');

test.describe('authentication', () => {
  test('shows client-side validation errors on the registration form', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/en/register');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
    await expect(page.getByText('Please confirm your password.')).toBeVisible();
  });

  test('shows login errors for invalid credentials', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/en/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
    await expect(page).toHaveURL('/en/login');
  });

  test('registers a new account and lands on the profile page', async ({ page }) => {
    const email = `playwright-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const password = 'StrongPass123';

    await gotoAndWaitForHydration(page, '/en/register');

    await expect(page.getByRole('heading', { name: 'Start with a secure account and get into the app immediately.' })).toBeVisible();

    await page.getByLabel('Display name').fill('Playwright User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/en/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    await logoutFromProfileMenu(page);
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('rejects duplicate account creation on the registration page', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/en/register');

    await page.getByLabel('Display name').fill('Existing User');
    await page.getByLabel('Email').fill(seededUser.email);
    await page.getByLabel('Password', { exact: true }).fill('StrongPass123');
    await page.getByLabel('Confirm password').fill('StrongPass123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('An account already exists for this email.')).toBeVisible();
    await expect(page).toHaveURL('/en/register');
  });

  test('redirects authenticated users away from login and register pages', async ({ page }) => {
    await loginWithCredentials(page, seededUser.email, seededUser.password);

    await page.goto('/en/login');
    await expect(page).toHaveURL('/en/profile');
    await gotoAndWaitForHydration(page, '/en/register');
    await expect(page).toHaveURL('/en/profile');
  });

  test('logs in through the custom page, logs out, and loses access to protected pages', async ({ page }) => {
    await loginWithCredentials(page, seededUser.email, seededUser.password);
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    await logoutFromProfileMenu(page);
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await gotoAndWaitForHydration(page, '/en/profile');
    await expect(page).toHaveURL('/en');
  });
});
