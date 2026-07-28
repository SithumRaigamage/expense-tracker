import { test } from '@playwright/test';

/**
 * Captures the main screens for visual review. Not assertions — the layout and
 * overflow behaviour is covered by responsive.spec.ts. This exists so a human
 * (or a reviewer) can see what the app actually looks like with real data,
 * which no amount of DOM measurement tells you.
 *
 * Run with: npx playwright test e2e/screenshots.spec.ts
 * Output:   e2e/screens/
 */

const SCREENS = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'wallets', path: '/wallets' },
  { name: 'transactions', path: '/transactions' },
  { name: 'budget', path: '/budget' }
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812 }
];

for (const viewport of VIEWPORTS) {
  for (const screen of SCREENS) {
    test(`capture ${screen.name} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(screen.path, { waitUntil: 'networkidle' });

      // Let charts finish their entry animation before capturing.
      await page.waitForTimeout(1200);

      await page.screenshot({
        path: `e2e/screens/${screen.name}-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
}
