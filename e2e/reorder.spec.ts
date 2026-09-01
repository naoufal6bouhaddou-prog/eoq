import { expect, test, type Page } from '@playwright/test';

/**
 * Reorder point and safety stock, against the brief's third verification case:
 * d = 50/day, sigma = 8, L = 9 days, 95% cycle service level.
 */

const VERIFICATION_CASE =
  '/?d=10000&s=50&h=2&y=365&hm=u&ro=1&vm=d&pu=d&dd=50&l=9&sd=8&csl=95&lang=en';

async function figure(page: Page, name: string): Promise<string> {
  const text = await page.locator(`[data-testid="${name}"]:visible`).textContent();
  return (text ?? '').replace(/\s/g, ' ').trim();
}

/**
 * Pick one option out of a choice group. The radio itself is visually hidden
 * and its styled label sits over it, which is how a real user activates it, so
 * the test clicks the label too rather than forcing a click through it.
 */
async function choose(page: Page, label: string): Promise<void> {
  await page.getByText(label, { exact: true }).click();
  await expect(page.getByRole('radio', { name: label })).toBeChecked();
}

test('reproduces the third verification case', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  await expect.poll(() => figure(page, 'sigma-ddlt')).toBe('24.00');
  await expect.poll(() => figure(page, 'safety-factor')).toBe('1.6449');
  await expect.poll(() => figure(page, 'safety-stock-exact')).toBe('39.48');
  await expect.poll(() => figure(page, 'reorder-point-exact')).toBe('489.48');
});

test('rounds up to whole units, because rounding down undershoots the service level', async ({
  page,
}) => {
  await page.goto(VERIFICATION_CASE);

  await expect.poll(() => figure(page, 'safety-stock')).toBe('40');
  await expect.poll(() => figure(page, 'reorder-point')).toBe('490');
});

test('carries safety stock into the cost totals rather than leaving it aside', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  // 39.4765 units at H = 2 is 78.95 a year, on top of the 1414.21 cycle cost.
  await expect.poll(() => figure(page, 'safety-stock-cost')).toBe('78.95');
  await expect.poll(() => figure(page, 'result-trc')).toBe('1,493.17');

  // Q* itself does not move: safety stock is constant with respect to Q.
  await expect.poll(() => figure(page, 'result-quantity')).toBe('707.1');
});

test('asks for more safety stock as the service level rises', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);
  await expect.poll(() => figure(page, 'safety-stock')).toBe('40');

  const level = page.getByLabel('Cycle service level', { exact: true });
  await level.fill('99');
  await level.blur();

  await expect.poll(() => figure(page, 'safety-factor')).toBe('2.3263');
  await expect.poll(() => figure(page, 'safety-stock')).toBe('56');
});

test('refuses a 100% service level and says why', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  const level = page.getByLabel('Cycle service level', { exact: true });
  await level.fill('100');
  await level.blur();

  await expect(page.getByText('needs infinite safety stock', { exact: false })).toBeVisible();
});

test('calls it cycle service level, and says it is not fill rate', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  await expect(page.getByLabel('Cycle service level', { exact: true })).toBeVisible();
  await expect(page.getByText('This is not fill rate', { exact: false })).toBeVisible();
});

test('asks only for the deviations the chosen mode uses', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  // Demand varies, lead time fixed: no lead-time deviation to give.
  await expect(page.getByLabel('Std dev of demand per period', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Std dev of lead time', { exact: true })).toBeHidden();

  await choose(page, 'Lead time varies, demand fixed');
  await expect(page.getByLabel('Std dev of demand per period', { exact: true })).toBeHidden();
  await expect(page.getByLabel('Std dev of lead time', { exact: true })).toBeVisible();

  await choose(page, 'Both vary');
  await expect(page.getByLabel('Std dev of demand per period', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Std dev of lead time', { exact: true })).toBeVisible();
});

test('combines both sources of variability in quadrature', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  await choose(page, 'Both vary');
  const sigmaLeadTime = page.getByLabel('Std dev of lead time', { exact: true });
  await sigmaLeadTime.fill('3');
  await sigmaLeadTime.blur();

  // sqrt(9 x 64 + 2500 x 9) = 151.91, not 24 + 150.
  await expect.poll(() => figure(page, 'sigma-ddlt')).toBe('151.91');
});

test('switches the period wording from days to weeks', async ({ page }) => {
  await page.goto(VERIFICATION_CASE);

  await choose(page, 'Week');
  await expect(page.getByText('units/week').first()).toBeVisible();
});

test('says what the reorder point is still waiting for', async ({ page }) => {
  await page.goto('/?d=10000&s=50&h=2&y=365&hm=u&ro=1&vm=d&pu=d&lang=en');

  await expect(page.getByText('Average demand per period', { exact: false }).first()).toBeVisible();
  await expect(page.locator('[data-testid="reorder-point"]')).toHaveCount(0);
});
