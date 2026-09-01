import { expect, test } from '@playwright/test';

/**
 * The two sensitivity tables, against D = 10 000, S = 50, H = 2, where
 * Q* = 707.11 and TRC = 1414.21.
 */
const CASE = '/?d=10000&s=50&h=2&y=365&hm=u&lang=en';

/**
 * A row of the penalty table by its Q/Q* ratio. Addressed by attribute rather
 * than by text: the figure is split into two cells for decimal alignment, so
 * a text selector would land on the fragment, not the row.
 */
function penaltyRow(page: import('@playwright/test').Page, ratio: number) {
  return page.getByTestId('penalty-table').locator(`tbody tr[data-ratio="${ratio}"]`);
}

test('shows the full ratio range from half the optimum to twice it', async ({ page }) => {
  await page.goto(CASE);

  const rows = page.getByTestId('penalty-table').locator('tbody tr');
  await expect(rows).toHaveCount(11);
  await expect(rows.first().locator('th')).toHaveText('0.50');
  await expect(rows.last().locator('th')).toHaveText('2.00');
});

test('prices being twenty percent under the optimum at two and a half percent', async ({
  page,
}) => {
  await page.goto(CASE);

  const row = penaltyRow(page, 0.8);
  await expect(row.locator('td').nth(0)).toHaveText('566');
  await expect(row.locator('td').nth(1)).toHaveText('1,449.57');
  await expect(row.locator('td').nth(2)).toHaveText('2.50');
});

test('is symmetric in the ratio, as the formula says it must be', async ({ page }) => {
  await page.goto(CASE);

  // 0.5 * (r + 1/r) gives the same penalty at 0.80 and at 1.25.
  await expect(penaltyRow(page, 0.8).locator('td').nth(2)).toHaveText('2.50');
  await expect(penaltyRow(page, 1.25).locator('td').nth(2)).toHaveText('2.50');
  await expect(penaltyRow(page, 0.5).locator('td').nth(2)).toHaveText('25.00');
  await expect(penaltyRow(page, 2).locator('td').nth(2)).toHaveText('25.00');
});

test('marks the optimum row, where the penalty is nil', async ({ page }) => {
  await page.goto(CASE);

  const optimum = page.getByTestId('penalty-optimum');
  await expect(optimum).toHaveCount(1);
  await expect(optimum.locator('th')).toContainText('1.00');
  await expect(optimum.locator('td').nth(0)).toHaveText('707');
  await expect(optimum.locator('td').nth(1)).toHaveText('1,414.21');
  await expect(optimum.locator('td').nth(2)).toHaveText('0.00');
});

test('varies each of the three inputs at four deviations plus a baseline', async ({ page }) => {
  await page.goto(CASE);

  const table = page.getByTestId('sensitivity-table');
  await expect(table.locator('tbody')).toHaveCount(3);
  await expect(table.locator('tbody tr')).toHaveCount(15);
  await expect(table.getByRole('rowheader', { name: 'Annual demand' })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'Cost per order' })).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'Holding cost' })).toBeVisible();
});

test('dampens an input error by the square root', async ({ page }) => {
  await page.goto(CASE);

  const demand = page.getByTestId('sensitivity-table').locator('tbody').nth(0);
  const rows = demand.locator('tr');

  // Demand 20% high: Q* rises by sqrt(1.2) - 1, which is 9.5%, not 20%.
  const high = rows.nth(4);
  await expect(high.locator('td').nth(1)).toHaveText('12,000.00');
  await expect(high.locator('td').nth(3)).toHaveText('+9.5');

  // Demand 20% low: Q* falls by 10.6%, again less than the error itself.
  const low = rows.nth(0);
  await expect(low.locator('td').nth(1)).toHaveText('8,000.00');
  await expect(low.locator('td').nth(3)).toHaveText('-10.6');
});

test('moves Q* the other way when holding cost is the input in error', async ({ page }) => {
  await page.goto(CASE);

  const holding = page.getByTestId('sensitivity-table').locator('tbody').nth(2);
  const high = holding.locator('tr').nth(4);

  // Q* is proportional to 1/sqrt(H), so a higher H means a smaller order,
  // while the cost still rises.
  await expect(high.locator('td').nth(3)).toHaveText('-8.7');
  await expect(high.locator('td').nth(5)).toHaveText('+9.5');
});

test('marks the baseline row of each input', async ({ page }) => {
  await page.goto(CASE);

  const baselines = page
    .getByTestId('sensitivity-table')
    .locator('tbody tr[data-optimum="true"]');
  await expect(baselines).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expect(baselines.nth(index).locator('td').nth(2)).toHaveText('707.1');
    await expect(baselines.nth(index).locator('td').nth(3)).toHaveText('0.0');
  }
});

test('says why the tables are worth reading', async ({ page }) => {
  await page.goto(CASE);

  await expect(page.getByText('flat near its minimum', { exact: false })).toBeVisible();
  await expect(page.getByText('estimation error is dampened', { exact: false })).toBeVisible();
});

test('keeps a wide table inside its own scroller', async ({ page }) => {
  await page.goto(CASE);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
