import { expect, test, type Page } from '@playwright/test';

/**
 * Labels in the diagrams must not land on top of each other.
 *
 * This is not a hypothetical: an axis tick and the Q* mark share a row, so
 * whenever Q* fell on a round number the two printed over one another; and the
 * reorder point and the safety stock are two horizontal rules that very nearly
 * coincide when Q dwarfs both, which put their labels in the same place. Both
 * were reported from real use.
 *
 * Rather than test the two cases that were reported, this checks the property
 * that was actually wanted: inside a diagram, no two pieces of text overlap.
 */

async function ready(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
}

/** Every pair of labels in a diagram that share screen space. */
async function collisions(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // A couple of pixels of slack: the labels carry a halo stroke, and boxes
    // that merely touch are not a legibility problem.
    const SLACK = 2;
    const found: string[] = [];

    for (const svg of document.querySelectorAll('svg[role="img"]')) {
      const labels = [...svg.querySelectorAll('text')]
        .map((node) => ({ text: (node.textContent ?? '').trim(), box: node.getBoundingClientRect() }))
        .filter((label) => label.text !== '' && label.box.width > 0);

      for (let a = 0; a < labels.length; a += 1) {
        for (let b = a + 1; b < labels.length; b += 1) {
          const one = labels[a];
          const two = labels[b];
          const overlapX =
            Math.min(one.box.right, two.box.right) - Math.max(one.box.left, two.box.left);
          const overlapY =
            Math.min(one.box.bottom, two.box.bottom) - Math.max(one.box.top, two.box.top);
          if (overlapX > SLACK && overlapY > SLACK) {
            found.push(`"${one.text}" over "${two.text}"`);
          }
        }
      }
    }
    return found;
  });
}

/**
 * Cases chosen because they broke: Q* landing exactly on a round tick, and a
 * reorder point dwarfed by the order quantity so its rule sits on the safety
 * stock rule.
 */
const CASES: Record<string, string> = {
  'Q* on a round tick, reorder point dwarfed by Q':
    '/?d=1000000&s=50&h=1&y=365&hm=u&ro=1&vm=d&pu=w&dd=2.5&l=100&sd=5&csl=95&lang=fr',
  'the worked example':
    '/?d=24000&s=450&i=22&c=38.5&y=300&m=120&hm=r&br=1:38.5,1500:37.2,4000:36.1&ro=1&vm=b&pu=d&dd=80&l=12&sd=14&sl=2&csl=95&lang=en',
  'the classic case, no reorder point':
    '/?d=10000&s=50&h=2&y=365&hm=u&lang=en',
  'French, where the words are longest':
    '/?d=10000&s=50&h=2&y=365&hm=u&ro=1&vm=d&pu=d&dd=50&l=9&sd=8&csl=95&lang=fr',
};

for (const [name, url] of Object.entries(CASES)) {
  test(`keeps every diagram label readable: ${name}`, async ({ page }) => {
    await page.goto(url);
    await ready(page);
    await page.waitForTimeout(400);

    expect(await collisions(page)).toEqual([]);
  });
}

test('drops an axis tick rather than printing it under the Q* mark', async ({ page }) => {
  // Q* is exactly 10 000 here, which is where a tick would otherwise fall.
  await page.goto('/?d=1000000&s=50&h=1&y=365&hm=u&lang=en');
  await ready(page);

  const marks = page.locator('svg[role="img"] .chart-mark');
  await expect(marks).toHaveCount(1);
  await expect(marks).toHaveText('Q*');

  const ticks = await page
    .locator('svg[role="img"] .chart-tick')
    .allTextContents();
  expect(ticks.map((tick) => tick.replace(/\s/g, ''))).not.toContain('10000');
});

test('sends the two stock rules to opposite ends so they cannot collide', async ({ page }) => {
  await page.goto('/?d=1000000&s=50&h=1&y=365&hm=u&ro=1&vm=d&pu=w&dd=2.5&l=100&sd=5&csl=95&lang=en');
  await ready(page);

  const safety = await page.getByTestId('profile-safety-stock-label').boundingBox();
  const reorder = await page.locator('.chart-threshold').boundingBox();
  expect(safety).not.toBeNull();
  expect(reorder).not.toBeNull();
  if (safety === null || reorder === null) return;

  // One anchored left, the other right, with clear air between them.
  expect(reorder.x).toBeGreaterThan(safety.x + safety.width);
});
