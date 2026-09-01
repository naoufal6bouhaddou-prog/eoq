import { expect, test, type Page } from '@playwright/test';

/**
 * The bilingual pass: both languages, both number conventions, and the
 * currency selector. What matters is that switching language changes the
 * numbers as well as the words, and that a value survives the switch.
 */

const CASE = '/?d=10000&s=50&h=2&y=365&hm=u&lang=en';

async function figure(page: Page, name: string): Promise<string> {
  const text = await page.locator(`[data-testid="${name}"]:visible`).textContent();
  return (text ?? '').replace(/\s/g, ' ').trim();
}

/**
 * The language buttons, matched exactly. Substring matching would also catch
 * the Next.js dev-tools button, whose label contains "en" in "Open".
 */
function language(page: Page, code: 'FR' | 'EN') {
  return page.getByRole('button', { name: code, exact: true });
}

/**
 * Text that is actually on screen. Q* and the total cost are labelled twice in
 * the markup, once for the pinned pair and once for the results band, and only
 * one of the two is displayed at any width.
 */
function shown(page: Page, text: string) {
  return page.getByText(text).filter({ visible: true }).first();
}

test('switches the whole interface, not only the labels', async ({ page }) => {
  await page.goto(CASE);
  await expect.poll(() => figure(page, 'result-trc')).toBe('1,414.21');

  await language(page, 'FR').click();

  // Words.
  await expect(shown(page, 'Quantité économique de commande')).toBeVisible();
  await expect(shown(page, 'Demande annuelle')).toBeVisible();
  // Figures: comma decimal mark, space grouping.
  await expect.poll(() => figure(page, 'result-trc')).toBe('1 414,21');
  await expect.poll(() => figure(page, 'result-quantity')).toBe('707,1');
});

test('sets the lang attribute so the page is announced correctly', async ({ page }) => {
  await page.goto(CASE);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await language(page, 'FR').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('rewrites what is already typed into the other convention', async ({ page }) => {
  await page.goto(CASE);
  await expect(page.getByLabel('Annual demand', { exact: true })).toHaveValue('10,000');

  await language(page, 'FR').click();
  await expect(page.getByLabel('Demande annuelle', { exact: true })).toHaveValue(/10.000/);

  // The same number, not a different one: the result did not move.
  await expect.poll(() => figure(page, 'result-quantity')).toBe('707,1');
});

test('carries a French-entered value into English unchanged', async ({ page }) => {
  await page.goto('/?y=365&hm=u&lang=fr');

  await page.getByLabel('Demande annuelle', { exact: true }).fill('1 234,56');
  await page.getByLabel('Coût de passation par commande', { exact: true }).fill('50');
  await page.getByLabel('Coût de possession unitaire', { exact: true }).fill('2');
  await page.getByLabel('Coût de passation par commande', { exact: true }).blur();

  await language(page, 'EN').click();
  await expect(page.getByLabel('Annual demand', { exact: true })).toHaveValue('1,234.56');
});

test('changes only the symbol when the currency changes', async ({ page }) => {
  await page.goto(CASE);
  const trc = await figure(page, 'result-trc');

  await page.getByLabel('Currency').selectOption('EUR');
  await expect(shown(page, '€')).toBeVisible();

  // The figure itself is untouched: the selector is a symbol, not a rate.
  await expect.poll(() => figure(page, 'result-trc')).toBe(trc);
});

test('defaults to dirhams', async ({ page }) => {
  await page.goto(CASE);
  await expect(page.getByLabel('Currency')).toHaveValue('MAD');
});

test('remembers the language on the next visit', async ({ page }) => {
  await page.goto(CASE);
  await language(page, 'FR').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  // A bare URL, so the choice can only have come from the stored preference.
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(shown(page, 'Demande et coûts')).toBeVisible();
});

test('lets a shared link override the stored language', async ({ page }) => {
  await page.goto(CASE);
  await language(page, 'FR').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  await page.goto(CASE);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('reports errors in the active language', async ({ page }) => {
  await page.goto('/?y=365&hm=u&lang=fr');

  const demand = page.getByLabel('Demande annuelle', { exact: true });
  await demand.fill('0');
  await demand.blur();
  await expect(page.getByText('Doit être supérieur à 0')).toBeVisible();
});

test('uses the French supply chain vocabulary throughout', async ({ page }) => {
  await page.goto(
    '/?d=24000&s=450&i=22&c=38.5&y=300&hm=r&br=1:38.5,1500:37.2,4000:36.1&ro=1&vm=d&pu=d&dd=80&l=12&sd=14&csl=95&lang=fr',
  );

  for (const term of [
    'Coût de passation',
    'Coût de possession',
    'Point de commande',
    'Stock de sécurité',
    'Remises sur quantité',
    'Taux de service par cycle',
  ]) {
    await expect(shown(page, term)).toBeVisible();
  }
});
