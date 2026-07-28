import { test, expect, Page } from '@playwright/test';

/**
 * The off-canvas panels are wrapped in a clipping container so a closed drawer
 * can no longer make the page scroll sideways. That wrapper covers the whole
 * viewport, so these tests guard the thing it could plausibly break: clicks
 * still reaching the page underneath, and the drawer still opening.
 */

test.describe('dashboard customise drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test('the closed drawer does not block the page', async ({ page }) => {
    // If the clipping wrapper swallowed pointer events, this button would be
    // unreachable and the click would time out.
    await expect(page.getByRole('button', { name: /customize dashboard/i })).toBeVisible();
    await page.getByRole('button', { name: /customize dashboard/i }).click();
    await expect(page.getByRole('heading', { name: /customize/i })).toBeVisible();
  });

  test('opens into view and closes again', async ({ page }) => {
    await page.getByRole('button', { name: /customize dashboard/i }).click();

    // Several off-canvas panels exist on the page; pick the one we opened, not
    // whichever happens to be first in the DOM.
    const panel = page
      .locator('div.absolute.inset-y-0.right-0')
      .filter({ has: page.getByRole('heading', { name: /customize/i }) });
    await expect(panel).toBeVisible();

    // Open means on-screen, not parked past the right edge. Poll rather than
    // sample once: the panel slides in over 300ms.
    const width = page.viewportSize()!.width;
    const rightEdge = async () => {
      const box = await panel.boundingBox();
      return box!.x + box!.width;
    };
    await expect.poll(rightEdge).toBeLessThanOrEqual(width + 1);
    expect((await panel.boundingBox())!.x).toBeLessThan(width);

    await panel.getByRole('button').first().click();

    await expect.poll(async () => (await panel.boundingBox())!.x).toBeGreaterThanOrEqual(width - 1);
  });
});
