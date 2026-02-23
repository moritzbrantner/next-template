import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3005";

export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts",
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL,
  },
  webServer: {
    command: "npm run dev -- --port 3005",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
