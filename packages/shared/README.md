# The shared layer

Everything both tools in **Supply Chain Tools** inherit without editing.

Published as `@sct/shared`, a private workspace package. It ships as TypeScript
source rather than as a built artefact, so each app compiles it through
`transpilePackages` and points Tailwind at it with `@source`. There is no build
step between this package and the apps, and there is exactly one copy of it.

The rule that defines this package: **nothing in here knows what an economic
order quantity is**, and nothing in here knows what a class A item is. If a file
needs to know, it belongs in an app's `lib/` or `components/` instead. That rule
is not a style preference — it is what makes the boundary checkable, and it is
checked:

```bash
grep -rniE "eoq|reorder|discount|abc|pareto" packages/shared/
```

Anything that turns up is either a comment or a mistake.

## What is here

```
packages/shared/
  styles.css        tokens, type scale, and every primitive: panels,
                    fields, buttons, segmented controls, tables,
                    figures, chart text, and the print rules
  lib/
    format.ts       locale-aware number parsing and formatting
    scale.ts        axis arithmetic for hand-built diagrams
    csv.ts          CSV writing, with the Excel details that matter
  ui/
    settings.tsx    locale and currency, generic over the dictionary
    AppShell.tsx    the family header
    Figure.tsx      a number split at its decimal mark
    Field.tsx       a text input that parses either decimal convention
    Controls.tsx    segmented control, section toggle, rail section
```

## The second tool arrived

`apps/abc` is the ABC inventory analyser, and it is what this layer was
extracted for. It is a separate site with its own address, which is precisely
why the layer has to be a package: two deployments, one design system, and no
second copy to keep in step. What the analyser needed that was not already here
is a short list, which is the useful result:

- **An ordinal ramp** (`--rank-1` / `--rank-2` / `--rank-3`) and `.rank-chip`.
  Three classes ranked by attention are not three meanings wanting three
  colours, so this is one hue thinning to neutral, with fill and border doing
  the work colour only reinforces. Added as a named role here rather than as
  literals in the tool, which is what the section below asks for.
- **`.field-input.field-text`**, for a field that takes a word. The rest of the
  system already knows that mono means a number and the text face means a word;
  the inputs did not, because the first tool has no field that takes a word.
- **`AppShell`'s `siblings`**, which is where the family stops being a claim in
  the header and becomes something a reader can walk between.
- **`SETTINGS_STORAGE_KEY`**, so a reader who picks French and MAD in one tool
  does not pick again in the next.

It also found a real bug in `.table-scroll`, which had no `position`. An
absolutely positioned box is clipped by its nearest *positioned* ancestor, not
by every scroller it happens to sit inside, so a `.sr-only` label deep in a wide
table resolved against the viewport instead, kept its static position seven
hundred pixels along the table, escaped the scroller and widened the whole
document. Sideways page scroll, caused by an element nobody can see. The first
tool has the same construction and was one wide table away from the same bug.

## How a second tool uses it

**Styles.** One import, in the tool's `globals.css`:

```css
@import 'tailwindcss';
@source '../../../packages/shared';
@import '../../../packages/shared/styles.css';
```

The `@source` line is not optional and its absence is silent. Tailwind detects
its sources from the package it is invoked in, so it never sees this one on its
own: every utility class used inside `ui/` is scanned by nobody, absent from the
built stylesheet, and the header quietly loses its layout.

**Settings.** The context is generic over the dictionary, so this layer never
learns a particular tool's strings. Each tool binds it once and its own call
sites keep full type safety on `t`:

```ts
// components/Settings.ts
export type Settings = SharedSettings<Dictionary>;
export function useSettings(): Settings {
  return useSharedSettings<Dictionary>();
}
```

**The shell** takes its words as props rather than reading a dictionary. A
shared component that reaches into one tool's strings is not shared, it is
borrowed:

```tsx
<AppShell labels={{ family: t.app.family, tool: t.app.tool, /* ... */ }} />
```

## Two things this layer got right by being extracted

Both surfaced only when the boundary was drawn, which is the argument for
drawing it:

- **`AppShell` was reading the dictionary out of the context.** It compiled and
  worked, and it would have made the shell unusable by any tool with different
  strings. It takes `labels` now.
- **`Settings` imported the tool's `Dictionary` type.** A type-level dependency
  pointing the wrong way, invisible at runtime. It is a type parameter now.

## The palette is a starting point

Ten tokens, chosen for one instrument. They are **not** a frozen system: the
palette is expected to change as sibling tools arrive and show what they
actually need — a chart with five series, a hub that has to tell six tools
apart, a state that is neither an error nor a result.

What should survive that growth is the property that makes the current set
work, not the set itself:

**Every colour has exactly one job, and you can say which one out loud.** A
palette of twenty stays coherent if all twenty are named for a function. One
of twelve falls apart the moment it contains a nice green that was needed
somewhere.

So when a second tool needs a colour the shared layer does not have, add a
**named role** here rather than a literal in that tool's own stylesheet. The
failure mode is not running out of colours; it is two tools inventing
different vocabularies for the same idea, which has to be reconciled later
instead of decided once.

## What deliberately stayed behind

`lib/validate.ts` holds a generic rule engine but also this tool's `FieldName`
union and its price-break checks. Splitting it would trade real type safety for
a boundary nobody is pushing against yet. When a second tool wants the rule
engine, that is the moment to split it — not before.
