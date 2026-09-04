# Supply Chain Tools

Two tools sharing one design system, one static build and one settings
preference. Everything runs in the browser; there is no backend, no database and
no analytics. `next build` writes a complete static site to `out/`.

| Route  | Tool                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `/`    | **Inventory ordering.** Economic order quantity, reorder point and safety stock, all-units quantity discounts, sensitivity analysis |
| `/abc` | **ABC analysis.** Ranks stocked items by annual consumption value and splits the ranked list into A, B and C |

Both are bilingual French and English, with locale-aware number entry and
formatting, and a currency selector for MAD, EUR and USD.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:3000>.

| Command              | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Development server on port 3000                            |
| `npm run build`      | Static build into `out/`, ready for any static host        |
| `npm test`           | Vitest unit tests over the calculation layer               |
| `npm run test:watch` | The same, in watch mode                                    |
| `npm run e2e`        | Playwright browser tests, desktop and 360px                |
| `npm run e2e:install`| Downloads the Chromium build Playwright drives             |
| `npm run typecheck`  | `tsc --noEmit`                                             |

Nothing is tied to one machine. Playwright starts and stops the dev server
itself on a loopback port, and every path in the repository is relative. A fresh
clone needs `npm install`, then `npm run e2e:install` once before the first
browser run.

Node 20.9 or later.

## Deploying

Vercel needs no configuration: it reads `next.config.ts`, sees
`output: 'export'`, and serves `out/`. Any other static host works the same way
by publishing the contents of `out/`.

## How it is put together

```
shared/           the layer a sibling tool inherits unchanged: tokens,
                  the stylesheet, number formatting, axis arithmetic, CSV
                  writing, and the interface primitives. See shared/README.md
lib/eoq.ts        the models: EOQ, all-units discounts, reorder point,
                  sensitivity, curve sampling. Plain numbers in and out.
lib/stats.ts      inverse normal CDF
lib/validate.ts   input rules, reported as typed codes
lib/derive.ts     the bridge: raw strings to checked numbers to results
lib/state.ts      the input model, and how it travels in a URL
lib/report.ts     what both exports carry, built once so they agree
lib/i18n/         one dictionary per language, same typed shape
lib/abc/          the second tool: classify.ts is the whole model, sample.ts
                  the worked example, rows.ts the text-to-number bridge,
                  i18n/ its own two dictionaries
components/       inputs, results, chart, tables, export
components/abc/   Pareto chart, class summary, the editable table
app/              layout, the ordering page, and app/abc/ the analyser
e2e/              Playwright specs
docs/             the design plan, written before any CSS
```

The maths is kept strictly apart from the interface. Nothing in `lib/eoq.ts`
imports React, calls `Intl`, or contains a user-facing string; it takes plain
numbers and returns plain numbers or typed objects, and it keeps full precision
throughout. Rounding happens only where a figure is drawn. That is what makes
the results checkable: `lib/eoq.test.ts` reads as worked examples, not as
assertions about a rendering.

Validation returns codes rather than sentences, so the same rule reads correctly
in both languages and the message can never drift from the rule it describes.

## Dependencies, and why each one is here

| Package                              | Reason                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `next`, `react`, `react-dom`         | The framework the brief specifies, and its static export       |
| `typescript`, `@types/*`             | TypeScript with `strict: true`                                 |
| `tailwindcss`, `@tailwindcss/postcss`| The styling layer the brief specifies, and how v4 is wired in  |
| `vitest`                             | Unit tests over the calculation layer                          |
| `@playwright/test`                   | Browser tests, so behaviour is checked where it actually runs  |

Six lines, and nothing else. No component kit, no chart library, no
internationalisation library, no statistics package, and no PDF library:

- The chart is hand-built SVG.
- The inverse normal CDF is Acklam's rational approximation, written out. One
  function is not worth a dependency.
- The dictionaries are two typed objects; `Dictionary` is `typeof en`, so a key
  missing from French is a build error.
- The PDF route is a print stylesheet and `window.print()`, which is lighter
  than a PDF library, keeps the chart as vector rather than as a raster, and
  uses the dialogue the reader already knows.

## Exports

**CSV** writes one file: the inputs, the results, the discount comparison and
both sensitivity tables. Three details matter more than they sound. The field
separator follows the locale, because a French Excel reads "," as a decimal
mark and would drop a comma-separated file into a single column. The file opens
with a byte order mark, or Excel reads the accents as mojibake. And figures are
written ungrouped, because the grouping character `Intl` emits is a narrow
no-break space and Excel will not parse it as a number.

**Print** is a stylesheet and `window.print()`. The interactive chrome goes, the
input rail goes and comes back as assumptions in the footer alongside the date,
and the chart stays as vector. Paper is not a narrow screen but a wide one that
happens to be short, so the arrangements that depend on viewport width are
restated for print. The sheet the brief asks for — results, chart, sensitivity —
plus the inventory sawtooth, fits one page of A4, and a test holds it there.
Adding the optional discount comparison and reorder point takes it to about a
page and a half.

## What the models do and do not cover

- **All-units discounts only.** Reaching a break re-prices the whole order.
  Incremental-discount schedules follow different arithmetic and are not
  implemented; the interface says so rather than quietly applying the wrong one.
- **Cycle service level**, the probability of not stocking out during a
  replenishment cycle. This is not fill rate, and the two are not
  interchangeable.
- Tier ranges are half-open, `[minQty, nextMinQty)`. The displayed upper bound
  is one unit lower, because orders are placed in whole units.
- The case pack multiple applies to the classic result, not to the discount
  comparison.

## Accessibility

Audited against the rendered page rather than against intentions, and held
there by `e2e/accessibility.spec.ts`: every control and every diagram carries an
accessible name, headings run without gaps under a single `h1`, focus is
visible on everything reachable, the chart readout is a real slider that
responds to arrow keys and announces its value, targets meet the 24px minimum,
motion is suppressed on request, and the page never scrolls sideways at 360,
390, 768, 1024 or 1440.

Both diagrams publish their data as a table for anyone not reading the picture.
Those tables uncovered a subtle bug worth knowing about: `.sr-only` does not
work applied to a `<table>`, because a table box will not shrink below its
min-content and simply ignores `width: 1px`. They are wrapped in a hidden
`div` instead.

Contrast was measured across every token pairing before any of it was written.
Everything clears WCAG AA in both palettes; the accent needed a companion
`--on-accent` token because it cannot carry white text in the dark palette.

## Verification

`lib/abc/classify.test.ts` carries the ABC cases: an item landing exactly on a
threshold, an item landing there only in binary arithmetic, a single item worth
more than the whole A band, a zero-cost row, and a total of zero. The café
sample is checked against a hand calculation summed off the sorted list —
527 200, 99 614 and 33 872 out of 660 686, which is five items carrying 79.8% of
the money. The two counterintuitive placements are asserted by name, because
they are the point of the sample rather than a property of it: cups at 0.62 each
are class A, a burr set at 1450 each is class C.

One deviation from the plain rule is deliberate and marked in the source. An
item crossing a threshold belongs to the class it crosses into, which for a
single dominant line means crossing both at once and coming out C, leaving the A
class empty. The richest line is always A instead. It is one conditional, and
deleting it restores the unguarded rule.

`lib/eoq.test.ts` carries the worked cases the models are checked against,
including D = 10 000, S = 50, H = 2 giving Q\* = 707.11 and TRC = 1414.21, and
d̄ = 50/day, σ = 8, L = 9 days at a 95% cycle service level giving a reorder
point of 489.48. The inverse normal is checked against a numerically integrated
normal rather than against typed-in constants, so the test owes nothing to the
approximation it is testing.
