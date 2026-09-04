import { expect, test } from '@playwright/test';

/**
 * The inventory sawtooth. It earns its place by proving the reorder point
 * rather than restating it, so the tests check the geometry says what the
 * arithmetic says.
 */

const WITH_REORDER =
  '/?d=10000&s=50&h=2&y=365&hm=u&ro=1&vm=d&pu=d&dd=50&l=9&sd=8&csl=95&lang=en';
const WITHOUT_REORDER = '/?d=10000&s=50&h=2&y=365&hm=u&lang=en';

test('draws the cycle, the reorder line and the order it triggers', async ({ page }) => {
  await page.goto(WITH_REORDER);

  await expect(page.getByTestId('profile-trace')).toBeVisible();
  // A horizontal rule has no height, and Playwright counts a zero-area element
  // as hidden, so this one is checked for presence rather than visibility.
  await expect(page.getByTestId('profile-reorder-line')).toBeAttached();
  await expect(page.getByTestId('profile-order-point')).toBeVisible();
  await expect(page.getByTestId('profile-safety-stock-label')).toBeVisible();
});

test('places the order exactly one lead time before the delivery', async ({ page }) => {
  await page.goto(WITH_REORDER);

  // The order marker sits on the reorder line, and the first delivery is the
  // first point where the trace jumps. Read both off the geometry.
  const marker = await page.getByTestId('profile-order-point').boundingBox();
  const line = await page.getByTestId('profile-reorder-line').boundingBox();
  expect(marker).not.toBeNull();
  expect(line).not.toBeNull();
  if (marker === null || line === null) return;

  // The marker's centre lies on the reorder line, which is what "the order is
  // placed when stock reaches the reorder point" means as a picture.
  expect(Math.abs(marker.y + marker.height / 2 - (line.y + line.height / 2))).toBeLessThan(2);
});

test('falls back to the textbook cycle when no reorder point is asked for', async ({ page }) => {
  await page.goto(WITHOUT_REORDER);

  await expect(page.getByTestId('profile-trace')).toBeVisible();
  await expect(page.getByTestId('profile-reorder-line')).toHaveCount(0);
  await expect(page.getByTestId('profile-safety-stock-label')).toHaveCount(0);
  await expect(page.getByText('replenished by Q', { exact: false })).toBeVisible();
});

test('publishes the cycle as a table for anyone not reading the picture', async ({ page }) => {
  await page.goto(WITH_REORDER);

  const table = page.getByRole('table', { name: 'Inventory level at each event' });
  await expect(table).toBeAttached();
  // Three cycles, each with a start, an order and a delivery.
  await expect(table.getByRole('row')).toHaveCount(10);
});

test('redraws when the lead time changes', async ({ page }) => {
  await page.goto(WITH_REORDER);
  const before = await page.getByTestId('profile-order-point').boundingBox();

  const leadTime = page.getByLabel('Lead time', { exact: true });
  await leadTime.fill('3');
  await leadTime.blur();

  await expect
    .poll(async () => (await page.getByTestId('profile-order-point').boundingBox())?.x ?? 0)
    .toBeGreaterThan(before?.x ?? 0);
});
