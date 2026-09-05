import { expect, test, type Page } from '@playwright/test';

/**
 * The ABC analyser, checked where it actually runs. The classification itself
 * is covered by lib/classify.test.ts; what is here is everything that only
 * exists once there is a browser: live recompute, the sort moving rows under
 * the cursor, the empty state, and the page not overflowing at 360px.
 */

const PAGE = '/?lang=en';

async function ready(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

/** The row inputs, in the order the table currently shows them. */
function nameInputs(page: Page) {
  return page.locator('[data-testid="item-row"] input[id^="name-"]');
}

test('opens already analysed, on the sample', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(30);
  await expect(page.locator('[data-testid="pareto-bar"]')).toHaveCount(30);
  await expect(page.locator('[data-testid="empty-state"]')).toHaveCount(0);

  // The finding, as the summary states it.
  await expect(page.locator('[data-testid="band-A-count"]')).toContainText('5');
  await expect(page.locator('[data-testid="band-A-item-share"]')).toContainText('16.7');
  await expect(page.locator('[data-testid="band-A-value-share"]')).toContainText('79.8');
  await expect(page.locator('[data-testid="total-value"]')).toContainText('660,686.00');
});

test('sorts by annual value descending, not by unit price', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await expect(nameInputs(page).nth(0)).toHaveValue('Espresso beans, house blend');
  await expect(nameInputs(page).nth(2)).toHaveValue('Takeaway cups, 12 oz');

  // The cheapest unit on the list is class A; the dearest is class C.
  const cups = page.locator('[data-testid="item-row"]').nth(2);
  await expect(cups).toHaveAttribute('data-class', 'A');
  await expect(cups.locator('input[id^="cost-"]')).toHaveValue('0.62');

  const burr = page.locator('[data-testid="item-row"]', {
    has: page.locator('input[value="Grinder burr set"]'),
  });
  await expect(burr).toHaveAttribute('data-class', 'C');
});

test('draws a marker for each threshold', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await expect(page.locator('[data-testid="threshold-line"]')).toHaveCount(2);
  await expect(page.locator('[data-testid="cumulative-trace"]')).toHaveCount(1);
});

test('recomputes on every keystroke, with no button to press', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  const total = page.locator('[data-testid="total-value"]');
  await expect(total).toContainText('660,686.00');

  // Empty the largest line. Everything downstream has to move at once.
  const beans = page.locator('[data-testid="item-row"]', {
    has: page.locator('input[value="Espresso beans, house blend"]'),
  });
  await beans.locator('input[id^="usage-"]').fill('');

  await expect(total).toContainText('473,486.00');
  await expect(page.locator('[data-testid="band-A-count"]')).not.toContainText('5');
  await expect(nameInputs(page).nth(0)).toHaveValue('Whole milk');
});

test('keeps the caret in the cell when the sort moves the row', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  // The knock box is last by value. Typing a large usage into it should carry
  // it to the top without the input being torn down under the cursor.
  const knock = page.locator('[data-testid="item-row"]', {
    has: page.locator('input[value="Knock box"]'),
  });
  const usage = knock.locator('input[id^="usage-"]');
  await usage.click();
  await usage.fill('9000');

  await expect(nameInputs(page).nth(0)).toHaveValue('Knock box');
  await expect(usage).toBeFocused();
});

test('treats an unparseable cell as zero rather than showing NaN', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  const beans = page.locator('[data-testid="item-row"]', {
    has: page.locator('input[value="Espresso beans, house blend"]'),
  });
  await beans.locator('input[id^="cost-"]').fill('not a number');

  await expect(page.locator('main')).not.toContainText('NaN');
  await expect(page.locator('[data-testid="total-value"]')).toContainText('473,486.00');
});

test('clears to one blank row and an empty state, and comes back', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await page.locator('[data-testid="clear-all"]').click();

  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(1);
  await expect(nameInputs(page).nth(0)).toHaveValue('');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="class-summary"]')).toHaveCount(0);
  // No figure is invented where there is nothing to divide.
  await expect(page.locator('main')).not.toContainText('NaN');

  // Clearing is never a door that closes behind you.
  await page.locator('[data-testid="load-example"]').click();
  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(30);
  await expect(page.locator('[data-testid="total-value"]')).toContainText('660,686.00');
});

test('classifies the one row a cleared table leaves as A', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await page.locator('[data-testid="clear-all"]').click();
  const row = page.locator('[data-testid="item-row"]').first();
  await row.locator('input[id^="name-"]').fill('Sole item');
  await row.locator('input[id^="usage-"]').fill('10');
  await row.locator('input[id^="cost-"]').fill('10');

  await expect(row).toHaveAttribute('data-class', 'A');
  await expect(page.locator('[data-testid="band-A-value-share"]')).toContainText('100.0');
});

test('adds and removes rows, and never removes the last one', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await page.locator('[data-testid="add-row"]').click();
  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(31);

  await page.locator('[data-testid="clear-all"]').click();
  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(1);

  // The remove button on the only row leaves a blank row, not an empty table.
  await page.locator('[data-testid="item-row"] button').first().click();
  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(1);
});

test('allows duplicate names without merging them', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  await page.locator('[data-testid="clear-all"]').click();
  const first = page.locator('[data-testid="item-row"]').first();
  await first.locator('input[id^="name-"]').fill('Oat milk');
  await first.locator('input[id^="usage-"]').fill('100');
  await first.locator('input[id^="cost-"]').fill('10');

  await page.locator('[data-testid="add-row"]').click();
  const second = page.locator('[data-testid="item-row"]').nth(1);
  await second.locator('input[id^="name-"]').fill('Oat milk');
  await second.locator('input[id^="usage-"]').fill('50');
  await second.locator('input[id^="cost-"]').fill('10');

  await expect(page.locator('[data-testid="item-row"]')).toHaveCount(2);
  await expect(page.locator('[data-testid="total-value"]')).toContainText('1,500.00');
});

test('follows the browser language, and starts in dirhams', async ({ page }) => {
  // The Playwright context runs in en-GB, so an English page here is the tool
  // reading navigator.language rather than imposing a language of its own.
  await page.goto('/');
  await ready(page);

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Currency')).toHaveValue('MAD');
  await expect(page.locator('[data-testid="total-value"]')).toContainText('660,686.00');
});

test('answers a French browser in French, and in dirhams', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByLabel('Devise')).toHaveValue('MAD');

  await context.close();
});

test('reads its figures in French and switches without losing them', async ({ page }) => {
  await page.goto('/?lang=fr');
  await ready(page);

  await expect(page.locator('[data-testid="total-value"]')).toContainText('660 686,00');
  await expect(page.getByRole('heading', { name: 'Analyse ABC des stocks' })).toBeVisible();

  // The language switch is a segmented control whose radios are hidden behind
  // their labels. A real user clicks the label, so the test does too.
  await page.getByText('EN', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'EN', exact: true })).toBeChecked();
  await expect(page.locator('[data-testid="total-value"]')).toContainText('660,686.00');
  await expect(page.locator('[data-testid="band-A-count"]')).toContainText('5');
});

test('offers the family link, pointing at the sibling site', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  // Following it would leave this site, and the sibling is not on this port.
  // What belongs to this suite is that the link is offered and aimed correctly.
  const link = page.getByRole('link', { name: 'Inventory ordering' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /^https?:\/\/.+/);
});

/* ---- The house rules the sibling tool is held to ------------------- */

test('never scrolls sideways, at any of the sizes it claims to support', async ({ page }) => {
  // Five full page loads in one test, each waiting for hydration. Against a
  // development server compiling under the rest of the suite that runs to
  // about half a minute, which is the default budget for a whole test rather
  // than for five navigations inside one.
  test.slow();

  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PAGE);
    await ready(page);
    await page.waitForTimeout(250);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
});

test('names every control and every diagram', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  const unnamed = await page.evaluate(() => {
    const named = (element: Element): boolean => {
      const id = element.getAttribute('id');
      const hasLabel = id !== null && document.querySelector(`label[for="${id}"]`) !== null;
      return (
        hasLabel ||
        element.closest('label') !== null ||
        (element.getAttribute('aria-label') ?? '').trim() !== '' ||
        element.getAttribute('aria-labelledby') !== null
      );
    };
    return [
      ...[...document.querySelectorAll('input, select, textarea')].filter(
        (element) => !named(element),
      ),
      ...[...document.querySelectorAll('button')].filter(
        (button) =>
          (button.textContent ?? '').trim() === '' &&
          (button.getAttribute('aria-label') ?? '').trim() === '',
      ),
    ].map((element) => element.outerHTML.slice(0, 90));
  });

  expect(unnamed).toEqual([]);

  await expect(page.locator('svg[role="img"]')).toHaveAttribute('aria-label', /\w/);
});

test('has one first-level heading and no gaps in the levels below it', async ({ page }) => {
  await page.goto(PAGE);
  await ready(page);

  const levels = await page.evaluate(() =>
    [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1])),
  );

  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  expect(levels[0]).toBe(1);
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  }
});

test('gives every target enough room to hit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'target size matters where fingers are');

  await page.goto(PAGE);
  await ready(page);

  const small = await page.evaluate(() => {
    const targets = [
      ...document.querySelectorAll('button, select, a[href], label[data-active]'),
    ].filter((element) => !element.classList.contains('sr-only'));
    return targets
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          html: element.outerHTML.slice(0, 70),
          w: Math.round(box.width),
          h: Math.round(box.height),
        };
      })
      .filter((box) => box.w > 0 && box.h > 0 && (box.w < 24 || box.h < 24));
  });

  expect(small).toEqual([]);
});
