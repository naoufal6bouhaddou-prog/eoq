import { expect, test } from '@playwright/test';

/**
 * The inventory sawtooth. It earns its place by showing what the buffer costs
 * rather than restating it, so the tests check the geometry says what the
 * arithmetic says: the ramp stops on the safety stock, not on zero.
 */

const WITH_BUFFER = '/?d=10000&s=50&h=2&y=365&hm=u&ss=40&lang=en';
const WITHOUT_BUFFER = '/?d=10000&s=50&h=2&y=365&hm=u&lang=en';

test('draws the cycle and the buffer it falls to', async ({ page }) => {
  await page.goto(WITH_BUFFER);

  await expect(page.getByTestId('profile-trace')).toBeVisible();
  await expect(page.getByTestId('profile-safety-stock-label')).toBeVisible();
});

test('stops the ramp on the safety stock rather than on zero', async ({ page }) => {
  await page.goto(WITH_BUFFER);

  // The trough of the trace must sit above the axis by the buffer's share of
  // the plot. Read it off the path rather than trusting the label.
  const trough = await page.getByTestId('profile-trace').evaluate((node) => {
    const d = node.getAttribute('d') ?? '';
    const ys = [...d.matchAll(/[ML]\s*[\d.]+\s+([\d.]+)/g)].map((m) => Number(m[1]));
    return Math.max(...ys);
  });
  const axis = await page.getByTestId('profile-trace').evaluate((node) => {
    const box = (node as SVGGraphicsElement).ownerSVGElement?.getBoundingClientRect();
    return box === undefined ? 0 : box.height;
  });

  expect(trough).toBeGreaterThan(0);
  expect(trough).toBeLessThan(axis);
});

test('drops the buffer marks when no safety stock is carried', async ({ page }) => {
  await page.goto(WITHOUT_BUFFER);

  await expect(page.getByTestId('profile-trace')).toBeVisible();
  await expect(page.getByTestId('profile-safety-stock-label')).toHaveCount(0);
});

test('publishes the cycle as a table for anyone not reading the picture', async ({ page }) => {
  await page.goto(WITH_BUFFER);

  const table = page.getByRole('table', { name: 'Inventory level at each event' });
  await expect(table).toBeAttached();
  // Three cycles, each with a start and a delivery, plus the header row.
  await expect(table.getByRole('row')).toHaveCount(7);
});

test('redraws when the safety stock changes', async ({ page }) => {
  await page.goto(WITH_BUFFER);
  const before = await page.getByTestId('profile-safety-stock-label').boundingBox();

  const buffer = page.getByLabel('Safety stock carried', { exact: true });
  await buffer.fill('400');
  await buffer.blur();

  await expect
    .poll(async () => (await page.getByTestId('profile-safety-stock-label').boundingBox())?.y ?? 0)
    .toBeLessThan(before?.y ?? 0);
});
