import { defineConfig } from '@playwright/test';

/**
 * End-to-end / responsive checks.
 *
 * Uses the Chrome already installed on the machine (`channel: 'chrome'`) rather
 * than downloading Playwright's own browser bundle, so `npm ci` stays light.
 * Run `npx playwright install chromium` if you would rather pin the bundled one.
 *
 * Expects the app on :4200 and the API on :3001 — `./start.sh` from the repo
 * root brings up both plus MongoDB.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
