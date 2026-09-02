import { expect, test, type Page } from '@playwright/test';

/**
 * All-units quantity discounts.
 *
 * The worked example is chosen so that all three tier outcomes appear at once:
 * D = 24 000, S = 450, i = 22%, C = 38.50, with breaks at 1, 1500 and 4000.
 * Tier 1's own EOQ lands above its range and is discarded, tier 2's falls
 * inside its range, and tier 3 is bought up to its break and wins.
 */
const SCHEDULE =
  '/?d=24000&s=450&i=22&c=38.5&y=300&hm=r&br=1:38.5,1500:37.2,4000:36.1&lang=en';

/** Rows of the comparison table specifically: the penalty table on the
 *  same page share its banded styling. */
function rows(page: Page) {
  return page.getByTestId('discount-table').locator('tbody tr');
}

function cell(page: Page, row: number, column: number) {
  return rows(page).nth(row).locator('td.n').nth(column);
}

/** Column order of the numeric cells in the comparison table. */
const UNIT_COST = 0;
const TIER_EOQ = 1;
const ORDER_QUANTITY = 2;
const PURCHASE = 3;
const ORDERING = 4;
const HOLDING = 5;
const TOTAL = 6;

test('evaluates every tier, not just the winner', async ({ page }) => {
  await page.goto(SCHEDULE);
  await expect(rows(page)).toHaveCount(3);
});

test('discards a tier whose own EOQ sits above the range where its price applies', async ({
  page,
}) => {
  await page.goto(SCHEDULE);

  // Tier 1 runs to 1499 but its EOQ is 1596.9, so that price is unreachable.
  await expect(cell(page, 0, TIER_EOQ)).toHaveText('1,596.9');
  await expect(cell(page, 0, ORDER_QUANTITY)).toHaveText('–');
  await expect(cell(page, 0, TOTAL)).toHaveText('–');
  await expect(rows(page).nth(0)).toContainText('EOQ above this range');
});

test('keeps a tier at its own EOQ when that falls inside its range', async ({ page }) => {
  await page.goto(SCHEDULE);

  await expect(cell(page, 1, TIER_EOQ)).toHaveText('1,624.6');
  await expect(cell(page, 1, ORDER_QUANTITY)).toHaveText('1,624.6');
  await expect(rows(page).nth(1)).toContainText('EOQ falls in range');
});

test('buys up to the break when a tier EOQ falls below it', async ({ page }) => {
  await page.goto(SCHEDULE);

  await expect(cell(page, 2, TIER_EOQ)).toHaveText('1,649.2');
  await expect(cell(page, 2, ORDER_QUANTITY)).toHaveText('4,000.0');
  await expect(rows(page).nth(2)).toContainText('Raised to the break');
});

test('adds purchase, ordering and holding into the tier total', async ({ page }) => {
  await page.goto(SCHEDULE);

  await expect(cell(page, 2, PURCHASE)).toHaveText('866,400.00');
  await expect(cell(page, 2, ORDERING)).toHaveText('2,700.00');
  await expect(cell(page, 2, HOLDING)).toHaveText('15,884.00');
  await expect(cell(page, 2, TOTAL)).toHaveText('884,984.00');
});

test('recommends the lowest total cost, not the lowest unit price alone', async ({ page }) => {
  await page.goto(SCHEDULE);

  const winner = page.getByTestId('discount-winner');
  await expect(winner).toHaveCount(1);
  await expect(winner.locator('td.n').last()).toHaveText('884,984.00');
  await expect(winner).toContainText('Lowest total cost');

  await expect(page.getByTestId('discount-recommendation')).toHaveText('4,000');
  await expect(page.getByText('With this schedule, order')).toBeVisible();
});

test('gives each tier its own holding cost when it is a rate on unit value', async ({ page }) => {
  await page.goto(SCHEDULE);

  await expect(page.getByText('each tier has its own H', { exact: false })).toBeVisible();

  // 22% of 38.50, 37.20 and 36.10 give different holding costs, so the three
  // tier EOQs differ even though D and S do not.
  await expect(cell(page, 0, TIER_EOQ)).not.toHaveText(await cell(page, 1, TIER_EOQ).innerText());
});

test('says which discount model it applies', async ({ page }) => {
  await page.goto(SCHEDULE);

  await expect(page.getByText('All-units model', { exact: false })).toBeVisible();
  await expect(page.getByText('Incremental schedules', { exact: false })).toBeVisible();
});

test('says the case pack multiple does not apply to this comparison', async ({ page }) => {
  await page.goto(`${SCHEDULE}&m=120`);
  await expect(page.getByText('not to this comparison', { exact: false })).toBeVisible();
});

test('reports a malformed schedule against the row that caused it', async ({ page }) => {
  await page.goto(SCHEDULE);

  const firstQuantity = page.getByLabel('Quantity from, Tier 1', { exact: true });
  await firstQuantity.fill('10');
  await expect(page.getByText('The first tier must start at quantity 1')).toBeVisible();

  await firstQuantity.fill('1');
  await expect(page.getByText('The first tier must start at quantity 1')).toBeHidden();

  const thirdQuantity = page.getByLabel('Quantity from, Tier 3', { exact: true });
  await thirdQuantity.fill('500');
  await expect(page.getByText('Each tier must start above the one before it')).toBeVisible();
});

test('refuses a fractional break quantity', async ({ page }) => {
  await page.goto(SCHEDULE);

  await page.getByLabel('Quantity from, Tier 2', { exact: true }).fill('1500.5');
  await expect(page.getByText('whole number of 1 or more', { exact: false })).toBeVisible();
});

test('adds and removes tiers', async ({ page }) => {
  await page.goto(SCHEDULE);
  await expect(rows(page)).toHaveCount(3);

  await page.getByRole('button', { name: 'Add tier' }).click();
  await page.getByLabel('Quantity from, Tier 4', { exact: true }).fill('8000');
  await page.getByLabel('Unit cost, Tier 4', { exact: true }).fill('35.40');
  await expect(rows(page)).toHaveCount(4);

  await page.getByRole('button', { name: 'Remove tier, Tier 4' }).click();
  await expect(rows(page)).toHaveCount(3);
});

test('holds the comparison back until the schedule is valid', async ({ page }) => {
  await page.goto(SCHEDULE);

  await page.getByLabel('Unit cost, Tier 2', { exact: true }).fill('0');
  await expect(page.getByText('Unit cost must be greater than 0')).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
});
