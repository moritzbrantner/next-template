import { expect, test } from "@playwright/test";

test("renders the shared package demo", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "{{ project_name }}" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Primary Action" })).toBeVisible();
});
