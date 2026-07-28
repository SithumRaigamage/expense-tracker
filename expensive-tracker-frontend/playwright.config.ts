import { defineConfig } from '@playwright/test';
import { STORAGE_STATE } from './e2e/global-setup';

/**
 * End-to-end / responsive checks.
 *
 * Uses the Chrome already installed on the machine (`channel: 'chrome'`) rather
 * than downloading Playwright's own browser bundle, so `npm ci` stays light.
 * Run `npx playwright install chromium` if you would rather pin the bundled one.
 *
 * Expects the app on :4200 and the API on :3001 — `./start.sh` from the repo
 * root brings up both plus MongoDB.
 *
 * A full sweep is ~30 page loads, each fanning out to roughly ten endpoints, so
 * repeated runs will trip the API's general rate limit. Start the backend with
 * RATE_LIMIT_DISABLED=true when iterating on these tests.
 */
export default defineConfig({
  testDir: './e2e',
  // One login for the whole run: logging in per test tripped the API's
  // brute-force limiter and failed the suite with 429s.
  globalSetup: './e2e/global-setup.ts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    storageState: STORAGE_STATE,
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
