import { expect, test } from '@playwright/test';
import { gotoAndWaitForHydration } from '@/tests/e2e/helpers';

test('story page renders the isolated scroll demo', async ({ page }) => {
  await gotoAndWaitForHydration(page, '/en/examples/story');

  await expect(page.getByRole('heading', { name: 'Story Scroll Demo' })).toBeVisible();
  await expect(page.getByText('This page is the staging area for the upcoming motion.dev rewrite.')).toBeVisible();
  await expect(page.getByText('Internal Progression')).toBeVisible();
});
