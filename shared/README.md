# The shared layer

Everything a second tool in **Supply Chain Tools** inherits without editing.

The rule that defines this directory: **nothing in here knows what an economic
order quantity is.** If a file needs to know, it belongs in `lib/` or
`components/` instead. That rule is not a style preference — it is what makes
the boundary checkable, and it is checked:

```bash
grep -rniE "eoq|reorder|discount" shared/
```

Anything that turns up is either a comment or a mistake.

## What is here

```
shared/
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

## How a second tool uses it

**Styles.** One import, in the tool's `globals.css`:

```css
@import 'tailwindcss';
@import '../shared/styles.css';
```

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
