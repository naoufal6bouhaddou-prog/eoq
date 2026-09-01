import { expect, test, type Page } from '@playwright/test';

/**
 * The cost curve. What matters here is not that pixels landed somewhere, but
 * that the chart says the right thing: the crossing sits at Q*, the readout
 * tracks pointer and keyboard, and a discount schedule breaks the curve into
 * separate segments instead of joining them up.
 */

const CLASSIC = '/?d=10000&s=50&h=2&y=365&hm=u&lang=en';

/** The worked example: three tiers at 1, 1500 and 4000. */
const WITH_DISCOUNTS =
  '/?d=24000&s=450&i=22&c=38.5&y=300&hm=r&br=1:38.5,1500:37.2,4000:36.1&lang=en';

async function figure(page: Page, name: string): Promise<string> {
  const text = await page.locator(`[data-testid="${name}"]:visible`).textContent();
  return (text ?? '').replace(/\s/g, ' ').trim();
}

test('draws the three classic traces', async ({ page }) => {
  await page.goto(CLASSIC);

  await expect(page.getByTestId('trace-ordering')).toBeVisible();
  await expect(page.getByTestId('trace-holding')).toBeVisible();
  await expect(page.getByTestId('trace-total')).toBeVisible();
  await expect(page.getByTestId('discount-segment')).toHaveCount(0);
});

test('opens its readout at the optimum, where the penalty is nil', async ({ page }) => {
  await page.goto(CLASSIC);

  await expect.poll(() => figure(page, 'readout-quantity')).toBe('707');
  await expect.poll(() => figure(page, 'readout-cost')).toBe('1,414.21');
  await expect.poll(() => figure(page, 'readout-penalty')).toBe('0.00');
});

test('reads out cost at any quantity from the keyboard', async ({ page }) => {
  await page.goto(CLASSIC);
  await expect.poll(() => figure(page, 'readout-quantity')).toBe('707');

  const plot = page.getByRole('slider');
  await plot.focus();
  for (let press = 0; press < 5; press += 1) await plot.press('ArrowRight');

  // Moved off the optimum, so the quantity rose and the penalty left zero.
  const quantity = Number((await figure(page, 'readout-quantity')).replace(/,/g, ''));
  expect(quantity).toBeGreaterThan(707);
  expect(Number(await figure(page, 'readout-penalty'))).toBeGreaterThan(0);

  await plot.press('Home');
  await expect.poll(() => figure(page, 'readout-quantity')).toBe('177');
});

test('reads out cost where the pointer is', async ({ page }) => {
  await page.goto(CLASSIC);
  const plot = page.getByRole('slider');
  const box = await plot.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) return;

  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2);
  await expect
    .poll(async () => Number((await figure(page, 'readout-quantity')).replace(/,/g, '')))
    .toBeGreaterThan(1000);
});

test('publishes the curve as a table for anyone not reading the picture', async ({ page }) => {
  await page.goto(CLASSIC);

  const table = page.getByRole('table', { name: 'Cost curve values' });
  await expect(table).toBeAttached();
  await expect(table.getByRole('row')).toHaveCount(13); // header plus twelve samples
});

test('breaks the curve into one segment per tier when discounts apply', async ({ page }) => {
  await page.goto(WITH_DISCOUNTS);

  await expect(page.getByTestId('discount-segment')).toHaveCount(3);
  await expect(page.getByTestId('trace-ordering')).toHaveCount(0);
});

test('closes each segment where its tier starts and opens it where the next begins', async ({
  page,
}) => {
  await page.goto(WITH_DISCOUNTS);

  // Tier 1 starts at quantity 1, off the left of the chart, so only the two
  // tiers whose breaks are in view get a filled endpoint.
  await expect(page.getByTestId('endpoint-closed')).toHaveCount(2);
  await expect(page.getByTestId('endpoint-open')).toHaveCount(2);
});

test('drops at a price break rather than joining up across it', async ({ page }) => {
  await page.goto(WITH_DISCOUNTS);

  const open = page.getByTestId('endpoint-open').first();
  const closed = page.getByTestId('endpoint-closed').first();

  const openBox = await open.boundingBox();
  const closedBox = await closed.boundingBox();
  expect(openBox).not.toBeNull();
  expect(closedBox).not.toBeNull();
  if (openBox === null || closedBox === null) return;

  // Same quantity, lower cost: the pair sits at one x and the closed endpoint
  // is further down the page, which on an inverted axis means cheaper.
  expect(Math.abs(openBox.x - closedBox.x)).toBeLessThan(2);
  expect(closedBox.y).toBeGreaterThan(openBox.y + 4);
});

test('names the unit cost in force at the quantity being read', async ({ page }) => {
  await page.goto(WITH_DISCOUNTS);

  const plot = page.getByRole('slider');
  await plot.focus();
  await plot.press('End');

  // The far right of the chart is past the last break, so the cheapest tier.
  await expect(page.getByText('36.10')).toBeVisible();
});

test('says that the discount total carries purchase cost', async ({ page }) => {
  await page.goto(WITH_DISCOUNTS);
  await expect(page.getByText('the curve drops at each break', { exact: false })).toBeVisible();
});
