# Supply Chain Tools

Two tools, two sites, one design system. Everything runs in the browser; there
is no backend, no database and no analytics. Each app builds to a complete
static site.

| App        | What it does                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `apps/eoq` | **Inventory ordering.** Economic order quantity, reorder point and safety stock, all-units quantity discounts, sensitivity analysis |
| `apps/abc` | **ABC analysis.** Ranks stocked items by annual consumption value and cuts the ranked list into A, B and C |

Both are bilingual French and English, with locale-aware number entry and
formatting, and a currency selector for MAD, EUR and USD. Each opens in the
reader's own language and remembers a choice made in either, because they share
one stored preference.

## Why a workspace

The two tools are deployed separately and read as separate sites, but they are
one design system. `packages/shared` holds it, and there is exactly one copy:
tokens, the stylesheet, number formatting, axis arithmetic, CSV writing, and the
interface primitives. A second copy would diverge at the first correction, which
is the whole reason this is a workspace and not two repositories.

```
packages/shared     the layer both tools inherit unchanged. See its own README
packages/tools      who is in the family, and where each member lives
apps/eoq            the ordering calculator, at eoq.vercel.app
apps/abc            the ABC analyser, at abc-analyser.vercel.app
docs/               the design plan, written before any CSS
```

Two packages rather than one, because they answer different questions.
`shared` is defined by a rule it can be checked against: nothing in it knows
any tool's domain, and `grep -rniE "eoq|reorder|discount|abc|pareto"` over it
turns up only comments. A roster naming ABC and EOQ would break that rule and
blunt the check, so the roster lives next door.

`packages/tools` is what stops the family growing as N by N-1. Before it, each
tool carried every other tool's address and name in both languages, so adding
the third meant reopening the first two. Adding a tool is one entry there now,
and every header recomputes its own links from it.

The shared layer ships as TypeScript source rather than as a built artefact, so
each app compiles it (`transpilePackages`) and Tailwind is pointed at it
(`@source`). No build step sits between the two.

## Running it

```bash
npm install
```

One command per tool, on different ports so both can run at once:

```bash
npm run dev:eoq
```

```bash
npm run dev:abc
```

`dev:eoq` serves <http://localhost:3000>, `dev:abc` serves
<http://localhost:3001>.

| Command             | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev:eoq`   | Ordering calculator, port 3000                                    |
| `npm run dev:abc`   | ABC analyser, port 3001                                           |
| `npm run build`     | Static build of both apps, into each app's `out/`                 |
| `npm test`          | Vitest across the shared layer and both calculation layers        |
| `npm run typecheck` | `tsc --noEmit` across all three packages                          |
| `npm run e2e`       | Playwright, both suites, desktop and 360px                        |
| `npm run e2e:install` | Downloads the Chromium build Playwright drives                  |

Anything can also be run against one package: `npm test --workspace @sct/abc`.

Nothing is tied to one machine. Playwright starts and stops its own dev server
on a loopback port, and every path in the repository is relative. A fresh clone
needs `npm install`, then `npm run e2e:install` once before the first browser
run.

Node 20.9 or later.

## Deploying

One Vercel project per app, both pointed at this repository, each with its
**Root Directory** set to the app:

| Vercel project | Root Directory |
| -------------- | -------------- |
| the ordering calculator | `apps/eoq` |
| the ABC analyser        | `apps/abc` |

Vercel reads `next.config.ts`, sees `output: 'export'`, and serves `out/`. It
installs from the workspace root on its own, so the shared package resolves
without extra configuration. Any other static host works the same way by
publishing an app's `out/`.

Each app links to the rest of the family in its header, and takes those links
from `packages/tools` rather than from its own configuration. Moving a tool to
a different address is one line in `registry.ts`, not a setting on every
project that points at it.

Addresses there are written out rather than read from the environment, so a
preview deployment links to its siblings in production. That is the honest
behaviour: a preview of one tool says nothing about the state of the others.
`NEXT_PUBLIC_SITE_URL` still overrides the address an app advertises to social
crawlers, which is what actually matters on a preview.

## Adding a third tool

```
apps/<id>/                    copy either app's configs; they differ only in
                              the dev port and the package name
packages/tools/registry.ts    one entry: id, url, name and blurb per language
```

Then a Vercel project with Root Directory `apps/<id>`. Nothing else changes:
the existing tools pick the newcomer up from the roster, in both languages,
without being edited.

## How each tool is put together

```
apps/eoq/
  lib/eoq.ts        the models: EOQ, all-units discounts, reorder point,
                    sensitivity, curve sampling. Plain numbers in and out.
  lib/stats.ts      inverse normal CDF
  lib/validate.ts   input rules, reported as typed codes
  lib/derive.ts     the bridge: raw strings to checked numbers to results
  lib/state.ts      the input model, and how it travels in a URL
  lib/report.ts     what both exports carry, built once so they agree
  lib/i18n/         one dictionary per language, same typed shape
  components/       inputs, results, chart, tables, export
  app/              layout and the single page

apps/abc/
  lib/classify.ts   the whole model: value, order, shares, the three bands
  lib/sample.ts     the worked example, in both languages
  lib/rows.ts       the bridge: what is typed in a cell to what is classified
  lib/i18n/         its own two dictionaries
  components/       Pareto chart, class summary, the editable table
  app/              layout and the single page
```

The maths is kept strictly apart from the interface in both. Nothing in
`lib/eoq.ts` or `lib/classify.ts` imports React, calls `Intl`, or contains a
user-facing string; each takes plain numbers and returns plain numbers or typed
objects, keeping full precision throughout. Rounding happens only where a figure
is drawn. That is what makes the results checkable: the tests read as worked
examples, not as assertions about a rendering.

Validation returns codes rather than sentences, so the same rule reads correctly
in both languages and the message can never drift from the rule it describes.

## Dependencies, and why each one is here

| Package                              | Reason                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `next`, `react`, `react-dom`         | The framework the brief specifies, and its static export       |
| `typescript`, `@types/*`             | TypeScript with `strict: true`                                 |
| `tailwindcss`, `@tailwindcss/postcss`| The styling layer the brief specifies, and how v4 is wired in  |
| `vitest`                             | Unit tests over the calculation layers                         |
| `@playwright/test`                   | Browser tests, so behaviour is checked where it actually runs  |

Six lines, and nothing else. No component kit, no chart library, no
internationalisation library, no statistics package, and no PDF library:

- Every chart is hand-built SVG.
- The inverse normal CDF is Acklam's rational approximation, written out. One
  function is not worth a dependency.
- The dictionaries are typed objects; each language's shape is `typeof en`, so a
  key missing from French is a build error.
- The PDF route is a print stylesheet and `window.print()`, which is lighter
  than a PDF library, keeps the chart as vector rather than as a raster, and
  uses the dialogue the reader already knows.

## Exports, in the ordering calculator

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
restated for print.

## What the models do and do not cover

**Ordering calculator**

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

**ABC analyser**

- Classification is on annual consumption **value**, never on quantity and never
  on unit price. That is the entire model, and the usual mistake.
- Thresholds are fixed. An item that crosses one belongs to the class it crosses
  into, with a single marked exception described under Verification.
- Duplicate item names are kept as separate rows and never merged.

## Accessibility

Audited against the rendered page rather than against intentions, and held there
by the end-to-end suites: every control and every diagram carries an accessible
name, headings run without gaps under a single `h1`, focus is visible on
everything reachable, targets meet the 24px minimum, motion is suppressed on
request, and neither page ever scrolls sideways at 360, 390, 768, 1024 or 1440.

Every diagram publishes its data as a table for anyone not reading the picture.
Those tables uncovered two bugs worth knowing about. `.sr-only` does not work
applied to a `<table>`, because a table box will not shrink below its min-content
and simply ignores `width: 1px`; they are wrapped in a hidden `div` instead. And
an absolutely positioned `.sr-only` label is clipped by its nearest *positioned*
ancestor rather than by every scroller it sits inside, so one deep in a wide
table escaped its scroller entirely and widened the whole document: sideways page
scroll caused by an invisible element. `.table-scroll` is a containing block now.

Contrast was measured across every token pairing before any of it was written.

## Verification

`apps/eoq/lib/eoq.test.ts` carries the worked cases the models are checked
against, including D = 10 000, S = 50, H = 2 giving Q\* = 707.11 and
TRC = 1414.21, and d̄ = 50/day, σ = 8, L = 9 days at a 95% cycle service level
giving a reorder point of 489.48. The inverse normal is checked against a
numerically integrated normal rather than against typed-in constants, so the test
owes nothing to the approximation it is testing.

`apps/abc/lib/classify.test.ts` carries the ABC cases: an item landing exactly on
a threshold, an item landing there only in binary arithmetic, a single item worth
more than the whole A band, a zero-cost row, and a total of zero. The café sample
is checked against a hand calculation summed off the sorted list — 527 200,
99 614 and 33 872 out of 660 686, which is five items carrying 79.8% of the
money. The two counterintuitive placements are asserted by name, because they are
the point of the sample rather than a property of it: cups at 0.62 each are
class A, a burr set at 1450 each is class C.

One deviation from the plain rule is deliberate and marked in the source. An item
crossing a threshold belongs to the class it crosses into, which for a single
dominant line means crossing both at once and coming out C, leaving the A class
empty. The richest line is always A instead. It is one conditional, and deleting
it restores the unguarded rule.
