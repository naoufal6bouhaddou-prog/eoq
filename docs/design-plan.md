# Design plan

Second revision. The first, kept at `design-plan-v1.md`, was reviewed and
rejected: it still read as machine-made, and the brief it was written against has
changed. This tool is now one of several in a family called **Supply Chain
Tools**, and the client's three criteria are **clean, simple, and of the domain**.

That reframes the job. A family needs a system its siblings can inherit — tokens,
a shell, one way of setting a figure, one way of building a table — not a look
invented for this page. Anything here that only makes sense for an EOQ
calculator is a mistake.

## What was wrong with revision 1, in its own words

Written down so the same reflexes are not repeated:

1. **The concept lived in the document, not on the screen.** Revision 1 was about
   greenbar printer paper and a bin card's reorder red. On screen there were no
   bands, because there were no tables yet, and no red at all. What a reader
   actually saw was off-white, near-black and grey.
2. **`#F6F8F5` against `#FFFFFF` against `#E3EBE0`** sit so close together that
   they read as an absence of a decision rather than as a decision.
3. **Uniform full-width bands.** Header, results, sub-results, chart, tables:
   every section edge to edge, every one separated by the same hairline, all
   evenly weighted. Nothing anywhere for the eye to hold on to.
4. **The results row was a KPI strip.** Removing the border radius did not stop
   it being four equal cells with a label over a number.
5. **A period costume ages badly and does not generalise.** Greenbar was
   specific, which was the point, but a family of a dozen tools cannot all be
   1970s line-printer output without it becoming a gimmick.

## 1. Where the domain shows up

Not in the palette. A warehouse photograph, a truck glyph or a pallet-coloured
accent would be decoration, and decoration is the first thing to read as
generated.

It shows up in **content only this domain has**:

- **The sawtooth.** Inventory over time is the diagram every supply chain course
  draws: stock falls at the demand rate, reaches the reorder point, an order goes
  out, the lead time elapses, the delivery lands and the cycle restarts. This
  tool already computes all four quantities that diagram needs — Q, the reorder
  point, safety stock and the lead time — and does not draw it. Adding it is the
  most domain-honest change available, and it is information rather than
  ornament.
- **The vocabulary**, already done: quantité économique de commande, coût de
  passation, taux de service par cycle.
- **The thresholds.** A reorder point is a line on a floor that stock crosses.
  Warehouse floors are marked to ISO 3864: red stops you, everything else is
  unmarked ground. That is the whole colour logic below.

## 2. Colour

A neutral system with two marked colours and nothing else.

| Token           | Light     | Dark      | Job                                        |
| --------------- | --------- | --------- | ------------------------------------------ |
| `--ground`      | `#EEF1F4` | `#12161A` | the page behind the work                    |
| `--surface`     | `#FFFFFF` | `#1A1F25` | the working surface, raised on the ground   |
| `--surface-2`   | `#F5F7F9` | `#20262D` | table stripes, recessed cells               |
| `--line`        | `#DCE1E6` | `#2E3640` | borders                                     |
| `--line-strong` | `#B7C0C9` | `#3E4854` | table heads, dividers that carry weight     |
| `--text`        | `#0F151B` | `#E8ECF0` | figures and headings                        |
| `--text-2`      | `#586470` | `#9AA6B2` | labels, units, annotations                  |
| `--accent`      | `#14456B` | `#7FB2DC` | structure and the primary action            |
| `--signal`      | `#B3261E` | `#F08076` | a threshold: the reorder point, and only it |

**Ground against surface is the whole hierarchy.** Revision 1 had no containment,
so every section floated at the same level. A recessed ground with the work
raised on a white surface gives structure without a single shadow, gradient or
rounded-card grid.

**Two marked colours, one meaning each.** `--accent` is structure and the single
primary action. `--signal` is a threshold crossed: the reorder point, and the
recommended row of the discount comparison. If a third meaning ever wants a
colour, the answer is that it does not get one.

The accent is a deep slate navy, not a saturated brand blue: it sits under text
without competing with it, and it is neither Tailwind's `blue-500` nor
`indigo-600`.

## 3. Type

Unchanged from revision 1, because that part was arrived at by testing rather
than by taste.

**Overpass Mono** carries every figure. Descended from Overpass, drawn from the
US highway signage alphabet. Chosen over five other monospaces on evidence:
monospace gives a comma a whole character cell, so a wide face sets 1,414.21 as
`1, 414. 21`. Candidates were set side by side at display size and in a
seven-column money table before this one was picked.

**Archivo** carries every word: labels, headings, units, currency symbols.

The division is strict and load-bearing: mono means *this is a number*, Archivo
means *this is a word*. Neither ever does the other's job.

| Step        | Size          | Family  | Weight | Used for                        |
| ----------- | ------------- | ------- | ------ | ------------------------------- |
| `display`   | 30-40px fluid | mono    | 700    | the one answer                  |
| `figure-lg` | 20-24px       | mono    | 700    | supporting results              |
| `figure`    | 16px          | mono    | 400    | table figures                   |
| `body`      | 13px          | Archivo | 400    | input values, prose             |
| `label`     | 11.5px        | Archivo | 600    | column heads, section names     |
| `micro`     | 11px          | Archivo | 400    | units, annotations              |

Precision is unchanged and stated: money two decimals, quantities zero or one,
percentages one — except a penalty measured against the optimum, which gets two,
because how small it is happens to be the point of it.

## 4. Layout

### The shell, shared by every tool in the family

```
┌──────────────────────────────────────────────────────────────────────┐
│ Supply Chain Tools / Inventory ordering          FR EN  MAD  ...     │  shell
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────────────────┐  ┌───────────────────────────────────────┐  │
│   │ Demand and cost    │  │  Order                                │  │
│   │                    │  │       707.1 units                     │  │  the answer,
│   │ D  [     10 000  ] │  │  ───────────────────────────────────  │  │  given room
│   │ S  [        50   ] │  │  14.14 /yr   25.8 days  1 414,21 MAD  │  │
│   │ H  [         2   ] │  └───────────────────────────────────────┘  │
│   │                    │  ┌───────────────────────────────────────┐  │
│   │ Reorder point      │  │  Inventory over time    (sawtooth)    │  │
│   │ ...                │  └───────────────────────────────────────┘  │
│   │                    │  ┌───────────────────────────────────────┐  │
│   │ Price breaks       │  │  Annual cost            (cost curve)  │  │
│   │ ...                │  └───────────────────────────────────────┘  │
│   └────────────────────┘  ┌───────────────────────────────────────┐  │
│                           │  comparison and sensitivity tables    │  │
│                           └───────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
      ground shows between panels; every panel is a surface
```

The shell carries the family name and the tool name, and is the piece a sibling
tool imports unchanged. Everything below it belongs to this tool.

**The answer gets its own panel and its own size.** Q\* is why someone opened the
page; the other three figures are supporting detail, set smaller and beneath a
rule rather than beside it as equals. That asymmetry is the hierarchy revision 1
lacked.

### Narrow, 360px and up

One column. Answer panel first and pinned, then inputs, then diagrams, then
tables. Unchanged in substance from what is already built and tested.

## 5. Signature element

**The sawtooth.** It is the domain's own picture, it is drawn from numbers the
tool already has, and it puts the reorder point where it belongs: a marked line
that a falling stock level crosses. That crossing is the only place `--signal`
appears in the diagram, and it is the same red that marks the reorder point in
the results.

The cost curve stays, and keeps its crossing at Q\*, but it is no longer asked to
be the hero as well as the explanation. Two diagrams, one job each: the sawtooth
says *what happens*, the cost curve says *why this quantity*.

## 6. Self-critique

Would I have produced this for any other calculator brief?

**The ground-and-surface shell — partly.** It is the standard clean-application
shape and I would reach for it again. It stays because a family of tools needs a
consistent frame, and because revision 1's flat bands failed for the opposite
reason. What stops it being generic is what it contains, not its outline.

**The sawtooth — no.** It exists only in inventory management, it is drawn from
values this tool already computes, and it would be meaningless on any other
calculator. This is where the domain lives.

**A navy accent — yes, and that is the risk.** Neutral grey plus navy plus red is
the conventional operational palette, and conventional is a step from generic. It
stays, because across a family of tools legibility and neutrality beat novelty,
and because the discipline is the point: two marked colours, one meaning each,
everything else unmarked. If it reads flat once built, the fix is more contrast
between ground and surface, not a more interesting hue.

**Cut: greenbar banding.** Table stripes remain, because a wide numeric table
genuinely needs them, but they are `--surface-2` at low contrast now and carry no
period reference. The idea was sound; the costume was not.

**Cut: a third diagram.** An order-cycle timeline was drafted beside the
sawtooth. It said the same thing with less information. One diagram per idea.

---

## 7. Final pass against the banned-patterns list

Step 12 of the build order: reread §3.3 line by line against what was actually
built, mechanically wherever a grep can settle it.

### Checked and absent

No gradients of any kind, no gradient text, no animated blobs, no
glassmorphism, no `backdrop-blur`. No box shadows: the hierarchy is ground
against surface, which is why none were needed. Tailwind's default `blue-500`,
`indigo-600`, and every violet, purple, sky and cyan: not present, in either
palette.

No transitions and no keyframes anywhere, so there is no fade-and-slide-up
entrance and no hover lift to suppress. The reduced-motion block guards
something that does not currently exist, which is the right way round.

No tracked-out capitals: the label step is 11.5px at 600 weight with 0.005em
tracking, sentence case, and there are no eyebrow labels above headings at all.
No accented word in a headline. No arrows appended to buttons or links. No
01 / 02 / 03 markers. No icon library, no icon circles, no emoji: the interface
contains no icons whatsoever.

In the copy: none of the eleven banned words, no exclamation marks, no
rhetorical headings, no "not just X but Y", and no em dashes. Those last four
are held by tests rather than by vigilance. Buttons name what happens —
Download CSV, Load example, Clear all fields, Add tier — and errors say what is
wrong and how to fix it without apologising.

The only middle dots in the interface are multiplication signs inside the
formula `TRC = √(2·D·S·H)`. They are not a meta separator, and the one place a
meta separator had crept in was removed at step 4.

### Judged, and kept, with reasons

**Panels of uniform treatment.** Six sections share one container style, which
is adjacent to "content chopped into identical rounded cards". What the brief
identifies as the tell is specifically the large radius and the soft grey
shadow; these have a 6px radius, a 1px border and no shadow, and uniform
containers are how an application organises work rather than how a landing page
decorates it. The answer is separated by size, not by a different box: 40px
against 24px and below. Adding a coloured stripe to mark it further was
considered and rejected as ornament.

**A tinted near-black in the dark palette.** `--ground` is `#12161A`, which is a
blue-tinted near-black, and the brief rules those out where they stand in for a
considered dark. This one does not stand in for anything: it is one of nine
tokens with a measured ramp — ground, surface, surface-2, two line weights, two
text weights and two marked colours — and every pairing was measured against
WCAG before a line of it was written.

**Navy, grey and red is a conventional operational palette.** Flagged in §6 and
still true. It stays because across a family of tools legibility and neutrality
beat novelty, and the discipline is the point: two marked colours, one meaning
each, everything else unmarked.

**The header takes about 210px before the answer on a 360px screen.** The five
actions wrap to four rows in French, where the labels are longest. The answer
panel's figure is still on the first screen of a 780px viewport, so it was left
alone rather than solved with icons, which would have introduced the decorative
icon set the brief rules out.

### Found and fixed in the accessibility pass

Four defects, none of them cosmetic, all found by auditing the rendered page
rather than by rereading the source:

1. **`.sr-only` does not work on a `<table>`.** A table box will not shrink
   below its min-content, so `width: 1px` was ignored and both hidden data
   tables kept occupying about 320 by 150 pixels of layout while clipped out of
   sight. That was the whole of the remaining horizontal overflow at 360px.
   They are wrapped in a hidden `div` now.
2. **Flex items default to `min-width: auto`**, so the identity line in a panel
   head refused to shrink and pushed its panel past the viewport.
3. **Grid items default the same way**, so a panel holding a wide table pushed
   the page sideways instead of letting its own scroller do the work.
4. **The remove-tier buttons were 22px wide**, under the 24px minimum target
   size WCAG 2.2 asks for. Controls now have a 28px floor.

Also: there were two `<h1>` elements, the shell's and the print sheet's. The
print sheet's title line is a paragraph now.
