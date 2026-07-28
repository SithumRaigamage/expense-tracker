import { test, expect, Page } from '@playwright/test';

/**
 * Checks every main screen at the breakpoints the app claims to support.
 *
 * The assertion is deliberately narrow and objective: nothing may cause the page
 * to scroll sideways. Horizontal overflow is the failure mode that actually
 * breaks a phone layout — content sits off-screen with no way to reach it — and
 * unlike "does this look right", a browser can judge it.
 */

const VIEWPORTS = [
  { name: '320  (small phone)', width: 320, height: 640 },
  { name: '375  (phone)', width: 375, height: 812 },
  { name: '768  (tablet)', width: 768, height: 1024 },
  { name: '1024 (small laptop)', width: 1024, height: 768 },
  { name: '1440 (desktop)', width: 1440, height: 900 }
];

const PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'wallets', path: '/wallets' },
  { name: 'transactions', path: '/transactions' },
  { name: 'budget', path: '/budget' },
  { name: 'bills', path: '/bills' },
  { name: 'settings', path: '/settings/profile' }
];

const API = process.env.E2E_API_URL || 'http://localhost:3001/api/v1';
const CREDENTIALS = {
  email: process.env.E2E_EMAIL || 'sraig2002@gmail.com',
  password: process.env.E2E_PASSWORD || 'sithum123'
};

/** Log in through the API and seed the session the app expects, so the guard lets us in. */
async function signIn(page: Page) {
  const response = await page.request.post(`${API}/users/login`, { data: CREDENTIALS });
  expect(response.ok(), `login failed: ${response.status()} — is the backend seeded?`).toBeTruthy();

  const { data } = await response.json();
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', JSON.stringify(user));
    },
    [data.token, data.user] as const
  );
}

/** How far the page can be scrolled sideways, in CSS pixels. */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * The widest element actually forcing the page wider — the culprit when a test
 * fails. Elements sitting inside a clipping ancestor (an off-canvas drawer in a
 * `overflow-hidden` wrapper, a table in an `overflow-x-auto` pane) are excluded:
 * they stick out geometrically but cost the page nothing.
 */
const widestOffender = (page: Page) =>
  page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    let worst = { selector: 'none', right: 0 };

    const isClipped = (el: HTMLElement) => {
      for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
        const { overflowX } = getComputedStyle(node);
        if (overflowX !== 'visible') return true;
      }
      return false;
    };

    document.querySelectorAll<HTMLElement>('body *').forEach(el => {
      const { right, width } = el.getBoundingClientRect();
      if (width === 0 || right <= limit + 1) return;
      if (right > worst.right && !isClipped(el)) {
        const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join('.') : '';
        worst = { selector: `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`, right };
      }
    });

    return `${worst.selector} (extends to ${Math.round(worst.right)}px, viewport ${limit}px)`;
  });

for (const viewport of VIEWPORTS) {
  test.describe(`at ${viewport.name}`, () => {
    for (const target of PAGES) {
      test(`${target.name} does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await signIn(page);

        await page.goto(target.path, { waitUntil: 'networkidle' });
        await expect(page).toHaveURL(new RegExp(target.path.split('/')[1]));

        const overflow = await horizontalOverflow(page);
        expect(overflow, `overflows by ${overflow}px — widest: ${await widestOffender(page)}`)
          .toBeLessThanOrEqual(1); // 1px of rounding slack
      });
    }
  });
}
