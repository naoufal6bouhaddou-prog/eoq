import { formatForInput, parseNumber, type Locale } from '@sct/shared/lib/format';

import type { AbcItem } from './classify';
import { sampleItems } from './sample';

/**
 * The bridge between what is in the table and what the model can classify.
 *
 * A row holds the text the user actually typed, not a number. That is the
 * whole reason this file exists: a field being edited passes through states
 * that are not numbers at all, and a table that stored parsed values would
 * either refuse those keystrokes or lose them. Parsing happens on the way out,
 * once per render, and anything that will not parse counts as zero.
 */
export interface ItemRow {
  id: string;
  name: string;
  /** Units per year, as typed. */
  usage: string;
  /** Cost of one unit, as typed. */
  cost: string;
}

/**
 * Ids for rows the user adds. The sample carries its own, so a page that opens
 * on the example and is never edited renders identically on the server and on
 * the client, and hydration has nothing to disagree about.
 */
let created = 0;

export function newRowId(): string {
  created += 1;
  return `row-${created}`;
}

export function blankRow(): ItemRow {
  return { id: newRowId(), name: '', usage: '', cost: '' };
}

/** The worked example, with its figures written in the reader's convention. */
export function exampleRows(locale: Locale): ItemRow[] {
  return sampleItems(locale).map((item) => ({
    id: item.id,
    name: item.name,
    usage: formatForInput(item.annualUsage, locale),
    cost: formatForInput(item.unitCost, locale),
  }));
}

/**
 * Rewrite the figures in the table into another locale's conventions, leaving
 * anything that does not parse exactly as typed.
 *
 * Names are not touched. Once the table is on screen its names are the reader's
 * data, whether they arrived from the example or from the keyboard, and a tool
 * that quietly rewrote them on a language change would be editing that data.
 */
export function reformatRows(rows: readonly ItemRow[], from: Locale, to: Locale): ItemRow[] {
  const convert = (text: string): string => {
    const parsed = parseNumber(text, from);
    return parsed === null ? text : formatForInput(parsed, to);
  };
  return rows.map((row) => ({ ...row, usage: convert(row.usage), cost: convert(row.cost) }));
}

/**
 * What the classifier sees. Empty and unparseable cells become zero, which is
 * what the model does with them anyway, and names are trimmed so a stray space
 * cannot change where a tie is broken.
 */
export function toItems(rows: readonly ItemRow[], locale: Locale): AbcItem[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name.trim(),
    annualUsage: parseNumber(row.usage, locale) ?? 0,
    unitCost: parseNumber(row.cost, locale) ?? 0,
  }));
}
