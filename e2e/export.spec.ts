import { expect, test, type Page } from '@playwright/test';

/**
 * Export: the CSV a reader opens in a spreadsheet, and the print sheet a
 * reader saves as a PDF.
 */

const FULL =
  '/?d=24000&s=450&i=22&c=38.5&y=300&m=120&hm=r&br=1:38.5,1500:37.2,4000:36.1&ro=1&vm=b&pu=d&dd=80&l=12&sd=14&sl=2&csl=95&lang=en';

/**
 * Wait for the tool to have read the URL and computed a result before touching
 * anything. Clicking a button that React has not yet wired up does nothing at
 * all, which a test sees as a download that never arrives.
 */
async function ready(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

async function downloadCsv(page: Page): Promise<string> {
  await ready(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-csv').click(),
  ]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

test('downloads one file holding every section', async ({ page }) => {
  await page.goto(FULL);
  const csv = await downloadCsv(page);

  for (const heading of [
    'Inputs',
    'Results',
    'All-units discount comparison',
    'Cost of ordering the wrong quantity',
    'Sensitivity to input error',
  ]) {
    expect(csv).toContain(heading);
  }
});

test('names the file by date', async ({ page }) => {
  await page.goto(FULL);
  await ready(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('download-csv').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^inventory-ordering-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('carries the inputs, so the file records what produced it', async ({ page }) => {
  await page.goto(FULL);
  const csv = await downloadCsv(page);

  expect(csv).toContain('Annual demand,24000');
  expect(csv).toContain('Cost per order,450.00');
  expect(csv).toContain('Working days per year,300');
});

test('carries the results and the discount recommendation', async ({ page }) => {
  await page.goto(FULL);
  const csv = await downloadCsv(page);

  expect(csv).toContain('Economic order quantity,1596.9');
  expect(csv).toContain('884984.00');
  expect(csv).toMatch(/3 \(Lowest total cost\)/);
});

test('separates with a semicolon in French, where the comma is the decimal mark', async ({
  page,
}) => {
  await page.goto(FULL.replace('lang=en', 'lang=fr'));
  const csv = await downloadCsv(page);

  expect(csv).toContain('Demande annuelle;24000');
  // A French decimal comma survives, because the separator is not a comma.
  expect(csv).toContain('450,00');
  expect(csv).not.toContain('Demande annuelle,24000');
});

test('starts with a byte order mark so a spreadsheet reads the accents', async ({ page }) => {
  await page.goto(FULL.replace('lang=en', 'lang=fr'));
  const csv = await downloadCsv(page);

  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain('Coût de passation');
});

test('writes figures ungrouped, because a grouped one is not a number to Excel', async ({
  page,
}) => {
  await page.goto(FULL.replace('lang=en', 'lang=fr'));
  const csv = await downloadCsv(page);

  // 866 400,00 would not parse; 866400,00 does.
  expect(csv).toContain('866400,00');
  expect(csv).not.toMatch(/866\s400/);
});

test('hides the interactive chrome on paper and keeps the chart', async ({ page }) => {
  await page.goto(FULL);
  await ready(page);
  await page.emulateMedia({ media: 'print' });

  await expect(page.getByRole('button', { name: 'Load example' })).toBeHidden();
  await expect(page.getByLabel('Annual demand', { exact: true })).toBeHidden();
  await expect(page.locator('svg[role="img"]')).toBeVisible();
  await expect(page.locator('[data-testid="result-quantity"]:visible')).toBeVisible();
});

test('prints the assumptions and the date in the footer', async ({ page }) => {
  await page.goto(FULL);
  await ready(page);
  await page.emulateMedia({ media: 'print' });

  const footer = page.locator('footer.print-only');
  await expect(footer).toBeVisible();
  await expect(footer).toContainText('Input assumptions');
  await expect(footer).toContainText('Annual demand');
  await expect(footer).toContainText('Cycle service level');
  await expect(footer).toContainText('All-units discount model');
  await expect(footer).toContainText(/Generated \w/);
});

test('keeps the tables whole on paper instead of scrolling them', async ({ page }) => {
  await page.goto(FULL);
  await ready(page);
  await page.emulateMedia({ media: 'print' });

  const overflow = await page
    .locator('.table-scroll')
    .first()
    .evaluate((node) => getComputedStyle(node).overflowX);
  expect(overflow).toBe('visible');
});

test('fits the brief on one sheet of A4', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'measured at paper size, not at a screen size');

  // A4 portrait is 794 x 1123 CSS pixels at 96dpi; 11mm margins leave
  // 711 x 1040 for the layout, which is the viewport a printer hands the page.
  await page.setViewportSize({ width: 711, height: 1040 });
  await page.goto('/?d=10000&s=50&h=2&y=365&m=100&hm=u&lang=en');
  await ready(page);
  await page.emulateMedia({ media: 'print' });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(height).toBeLessThanOrEqual(1040);
});

test('lays the sensitivity tables side by side on paper', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'measured at paper size, not at a screen size');

  // Paper is not a narrow screen: it is a wide one that happens to be short,
  // so the arrangements that depend on viewport width are restated for print.
  await page.setViewportSize({ width: 711, height: 1040 });
  await page.goto('/?d=10000&s=50&h=2&y=365&hm=u&lang=en');
  await ready(page);
  await page.emulateMedia({ media: 'print' });

  const penalty = await page.getByTestId('penalty-table').boundingBox();
  const sensitivity = await page.getByTestId('sensitivity-table').boundingBox();
  expect(penalty).not.toBeNull();
  expect(sensitivity).not.toBeNull();
  if (penalty === null || sensitivity === null) return;

  expect(sensitivity.x).toBeGreaterThan(penalty.x + penalty.width - 1);
});
