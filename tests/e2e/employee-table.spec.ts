import { expect, test } from '@playwright/test';

test('the employee REST table is displayed with dummy data', async ({ page }) => {
  await page.goto('/en');

  await expect(page.getByRole('heading', { name: 'Generic REST endpoint table' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'First name' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Ava' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ava.thompson@example.com' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Yes' }).first()).toBeVisible();
});
