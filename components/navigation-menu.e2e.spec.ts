import { expect, test } from '@playwright/test';
import { gotoAndWaitForHydration } from '@/scripts/e2e/helpers';

test('navbar groups destinations into categories and reveals submenu links on click', async ({
  page,
}) => {
  await gotoAndWaitForHydration(page, '/en');
  const discoverSubmenu = page.locator('[data-slot="platform-navbar-submenu"]');

  await expect(page.getByRole('button', { name: 'Discover' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Workspace' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Discover' }).click();
  await expect(
    discoverSubmenu.getByRole('link', { name: 'About' }),
  ).toBeVisible();
  await expect(
    discoverSubmenu.getByRole('link', { name: 'Story Demo' }),
  ).toBeVisible();

  await discoverSubmenu.getByRole('link', { name: 'Story Demo' }).click();

  await expect(page).toHaveURL('/en/examples/story');
  await expect(
    page.getByRole('heading', { name: 'Story Scroll Demo' }),
  ).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL('/en');
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Discover' })).toBeVisible();
});
