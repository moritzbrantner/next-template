import { expect, test } from '@playwright/test';

test('the employee REST table page displays dummy data', async ({ page }) => {
  await page.goto('/en/table');

  await expect(page.getByRole('heading', { name: 'Employee table' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'First name' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Ava' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ava.thompson@example.com' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Yes' }).first()).toBeVisible();
});
