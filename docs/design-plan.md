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
