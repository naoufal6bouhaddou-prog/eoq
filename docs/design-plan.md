# Design plan

Written before any CSS, per the brief. The self-critique at the end is part of
the plan, not a postscript: three decisions changed because of it.

---

## 1. Colour

**Source: greenbar continuous-form printer paper.** The banded pale-green and
white fanfold stock that ran through IBM 1403 line printers, and that every
stock listing, MRP report and purchase order came out on from the 1960s to the
1980s. It is the native output medium of this exact subject, and its central
idea is functional rather than decorative: the bands exist so the eye can hold
a row across a wide numeric table. That is the same problem this tool has.

The red is separate and older. On a stores bin card the reorder level was
written in red, and a red signal clip marked the card when stock crossed it.
Red here means one thing only: **the number you act on.**

| Token         | Light     | Dark      | Job                                        |
| ------------- | --------- | --------- | ------------------------------------------ |
| `--paper`     | `#F6F8F5` | `#171E1A` | page ground                                |
| `--band`      | `#E3EBE0` | `#1E2722` | the greenbar stripe, on alternating rows   |
| `--surface`   | `#FFFFFF` | `#121815` | input fields and the chart plot area       |
| `--rule`      | `#C3D0C0` | `#37453C` | hairlines, used sparingly                  |
| `--ink`       | `#16211A` | `#E4EBE4` | figures and labels                         |
| `--ink-muted` | `#56655A` | `#9AAA9D` | units, annotations, column headers         |
| `--signal`    | `#B3352A` | `#E76257` | Q\*, the reorder point, the winning tier   |

Seven tokens, one of which is an accent. Contrast measured, not assumed: ink on
paper 15.5:1, muted on paper 5.8:1, muted on band 5.1:1, signal on paper 5.7:1,
and every dark pairing at or above 4.6:1. All clear AA for normal text. The
dark accent was moved twice to get there: the first two candidates read fine on
the page ground and failed on the band.

Dark mode earns its place: this is a long-dwell tool, read against a
spreadsheet on a second screen, and the chart's thin traces hold up better on a
dark ground. It is a second deliberate palette on the same seven tokens, not a
`dark:` sweep. It is a green-slate, not a tinted near-black, and the accent is
a true red rather than the acid-green-on-black that dark technical UIs default
to.

## 2. Type

**IBM Plex Mono, and nothing else.** It descends from the same IBM typographic
programme as the printouts the palette comes from, its tabular figures are
genuinely well made, and it is not the default developer-portfolio mono.

One family, on purpose. This tool has almost no prose — every string is a label
attached to a number. Adding a sans for the two sentences of explanatory copy
would mean pairing Plex Mono with a near-neighbour, which the brief rightly
calls a tell, or with a contrasting face doing almost no work.

Mono is load-bearing here, not garnish: it holds every figure in every table,
where column alignment is the point.

| Step         | Size | Weight | Tracking | Used for                             |
| ------------ | ---- | ------ | -------- | ------------------------------------ |
| `figure-lg`  | 30px | 600    | -0.02em  | Q\*, the reorder point               |
| `figure`     | 19px | 500    | -0.01em  | results band, table totals           |
| `body`       | 13px | 400    | 0        | input values, labels                 |
| `label`      | 11px | 500    | 0.03em   | column headers, section names        |
| `micro`      | 10px | 400    | 0.02em   | units, currency, endpoint notes      |

Sentence case throughout, including column headers. No tracked-out caps.

`font-variant-numeric: tabular-nums` on every figure. Money always two
decimals, quantities zero (one where the fraction matters), percentages one.
Figures are split at the decimal mark and laid out in a two-cell grid so
columns align on the point, not ragged right, even where rows carry different
precision. Result slots reserve their width so live updates do not shift the
layout.

## 3. Layout

A 12-column grid, 24px gutter, 1440px maximum. The input rail is a fixed 340px;
everything else flows. Alignment logic: **one vertical stripe of mathematical
symbols runs down the left edge of the input rail** — D, S, H, i, C, d̄, L, σ_d,
σ_L — so the rail reads like the variables list in a paper, and the input boxes
that follow them share one left edge and one right edge.

### Desktop, at or above 1100px

```
┌─────────────────────────────────────────────┬──────────────────────────────┐
│ Inventory ordering calculator               │ FR EN │ MAD ▾ │ Reset │ CSV  │  title block
├──────────────────────┬──────────────────────┴──────────────────────────────┤
│ Demand and cost      │  Q*            N            T            TRC        │
│  D  [     10 000   ] │  707           14.14        25.8         1 414.21    │  results band
│  S  [         50   ] │  units         orders/yr    days         MAD/yr     │
│  H  (o) per unit     │  ordering 707.11 = holding 707.11   balanced        │
│     ( ) rate × cost  ├─────────────────────────────────────────────────────┤
│  i  [       20 %   ] │  cost                                               │
│  C  [       5,00   ] │    |·.                                    ,-        │
│                      │    | ·.                                ,-'  total   │
│ Working year         │    |   `·._                        _,-'             │
│  d  [        365   ] │    |       `-.__            __,--''                 │
│ Case pack            │    |            `--+-------'      _,,--   holding   │
│  m  [        100   ] │    |          _,-' | `--..__,,--''                  │
│                      │    |      _,-'     |        ordering                │
│ Reorder point        │    +----------------+--------------------------- Q  │
│  mode (o)( )( )      │                    Q*                               │
│  d  [ 50 ] L [  9 ]  ├─────────────────────────────────────────────────────┤
│  sd [  8 ] sL [ 0 ]  │ All-units discount comparison                       │
│  CSL[     95 %   ]   │ tier  range      C     Q     purchase  ord  hold  TC│
│                      │ 1     1–999      5,00  700   25 000    350  350  ···│  banded rows
│ Price breaks         │ 2     1000–1999  4,85  1000  24 250    245  485  ···│
│  qty >=   unit cost  │ 3     2000+      4,75  2000  23 750    122  950  ···│  <- winner
│  1        5,00    x  ├───────────────────────────┬─────────────────────────┤
│  1000     4,85    x  │ Cost of the wrong Q       │ Sensitivity to input err│
│  2000     4,75    x  │ Q/Q*   Q      TRC    +%   │ param  dev   Q*    TRC  │
│  + add tier          │ 0.5    354    1 768  25.0 │ D      -20%  632   1265 │
│                      │ 1.0    707    1 414   0.0 │ D      -10%  671   1342 │
└──────────────────────┴───────────────────────────┴─────────────────────────┘
```

Inputs, the four headline results and the curve all sit above the fold at
1280×800. The tables are the only thing you scroll for.

### Mobile, 360px and up

```
┌────────────────────────┐
│ Inventory ordering     │
│ calculator             │
│ FR EN │ MAD ▾ │ ⋯      │
├────────────────────────┤
│ Q*   707 units         │  sticky: stays put while
│ TRC  1 414,21 MAD/yr   │  you edit the inputs below
├────────────────────────┤
│ Demand and cost        │
│  D  [      10 000    ] │
│  S  [          50    ] │
│  ...                   │
├────────────────────────┤
│ [ chart, full width ]  │
├────────────────────────┤
│ [ tables, scroll-x     │
│   inside their own     │
│   container ]          │
└────────────────────────┘
```

One column. The two figures a buyer came for stay pinned to the top of the
viewport while the inputs are edited, so the answer never has to be hunted
for. Tables scroll horizontally inside themselves; the page body never does.

## 4. Signature element

**The crossing point on the cost curve.** Ordering cost and holding cost meet
exactly at Q\*, and that intersection is the whole argument of the EOQ model.
So it gets the boldness budget:

- Three traces, all in ink, separated by weight and dash pattern rather than by
  colour, and labelled inline at their right-hand ends the way a plotted
  technical chart is, rather than by a legend.
- A red drop-line from the crossing to the x-axis, the only red on the page
  besides the reorder point.
- A crosshair that tracks pointer, touch and keyboard, reading out cost at any
  Q and the penalty against the optimum, into a fixed-width panel that does not
  reflow as the numbers change.
- Under a discount schedule the total-cost trace breaks at each price break,
  drawn with a filled endpoint where a tier starts and a hollow one where it
  ends — the standard notation for a half-open interval.

Everything else stays quiet: no shadows, no cards, no fills, rules only where a
band cannot do the job.

---

## 5. Self-critique

The test: would I have produced roughly this for any other calculator brief?

**Colour — passes.** Greenbar banding is specific to bulk numeric report
output. I would not reach for it on a mortgage or tip calculator, and the red
carries a domain meaning rather than an emphasis level.

**A 340px input rail beside a large result panel — fails.** That is the shape of
every calculator I would ever draw, and information adjacency demands it here,
so the layout stays. What changed is what fills it: the **symbol stripe** down
the left edge, D / S / H / i / C as a column of mathematical variables. Specific
to a tool driven by named formulas, and meaningless on a tip calculator.

**Three colour-coded curves — cut.** My first instinct was the universal
dashboard move: a colour per series plus a legend with three chips. Replaced
with one ink colour, three dash weights and inline end-labels. Reads as an
engineering plot instead of an analytics widget, survives colour blindness,
and leaves red free to mean one thing.

**Four result cards — cut.** First instinct was Q\*, N, T and TRC in four
rounded boxes. Replaced with a single ruled band divided by vertical hairlines:
a meter panel, not a card grid. It also removes the temptation to give each
card an icon.

**A second type family — cut.** Plex Mono plus Plex Sans was the obvious pairing
and is exactly the near-neighbour the brief warns about. There are two
sentences of prose in the entire tool; they can be mono.

**Border radius.** Not zero, which would be a deliberate hard-edge statement and
part of the broadsheet pastiche the brief rules out. 2px on fields and buttons
only, which is what an instrument fascia actually looks like. Panels have none.

**Rules.** Bands separate rows, not rules. Hairlines appear in four places: under
the title block, under a table header, between results in the band, and around
the chart plot area. Anywhere else would be the hairline-everywhere tell.
