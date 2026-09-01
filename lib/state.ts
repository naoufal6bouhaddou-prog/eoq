/**
 * The tool's input model, and how it travels in a URL.
 *
 * Every field is held as the raw string the user typed, so nothing is
 * reformatted or rounded behind their back mid-edit. Parsing happens once, in
 * lib/derive.ts, against the active locale.
 */

import type { VariabilityMode } from './eoq';
import { formatForInput, parseNumber, type Locale } from './format';

export type HoldingMode = 'perUnit' | 'rate';
export type PeriodUnit = 'day' | 'week';

export interface PriceBreakRow {
  minQty: string;
  unitCost: string;
}

export interface ToolState {
  annualDemand: string;
  orderCost: string;
  holdingMode: HoldingMode;
  holdingCostPerUnit: string;
  /** Entered as a percentage: 20 means 20% of unit cost. */
  holdingRate: string;
  unitCost: string;
  daysPerYear: string;
  roundingMultiple: string;

  reorderEnabled: boolean;
  variabilityMode: VariabilityMode;
  periodUnit: PeriodUnit;
  averageDemand: string;
  leadTime: string;
  demandStdDev: string;
  leadTimeStdDev: string;
  /** Entered as a percentage: 95 means a 95% cycle service level. */
  cycleServiceLevel: string;

  discountsEnabled: boolean;
  priceBreaks: PriceBreakRow[];
}

export const BLANK_STATE: ToolState = {
  annualDemand: '',
  orderCost: '',
  holdingMode: 'perUnit',
  holdingCostPerUnit: '',
  holdingRate: '',
  unitCost: '',
  daysPerYear: '365',
  roundingMultiple: '',

  reorderEnabled: false,
  variabilityMode: 'demand',
  periodUnit: 'day',
  averageDemand: '',
  leadTime: '',
  demandStdDev: '',
  leadTimeStdDev: '',
  cycleServiceLevel: '95',

  discountsEnabled: false,
  priceBreaks: [
    { minQty: '1', unitCost: '' },
    { minQty: '', unitCost: '' },
  ],
};

/**
 * A worked example, loaded on a first visit so the page is never blank.
 *
 * A distributor buying a mid-value part: 300 working days at 80 units a day is
 * the 24 000 annual demand, so the reorder inputs and the EOQ inputs describe
 * the same item rather than two unrelated ones. The discount schedule is chosen
 * to show all three tier outcomes at once — one tier infeasible, one solved at
 * its own EOQ, and the winner bought up to a break.
 */
export const EXAMPLE_STATE: ToolState = {
  annualDemand: '24000',
  orderCost: '450',
  holdingMode: 'rate',
  holdingCostPerUnit: '',
  holdingRate: '22',
  unitCost: '38.50',
  daysPerYear: '300',
  roundingMultiple: '120',

  reorderEnabled: true,
  variabilityMode: 'both',
  periodUnit: 'day',
  averageDemand: '80',
  leadTime: '12',
  demandStdDev: '14',
  leadTimeStdDev: '2',
  cycleServiceLevel: '95',

  discountsEnabled: true,
  priceBreaks: [
    { minQty: '1', unitCost: '38.50' },
    { minQty: '1500', unitCost: '37.20' },
    { minQty: '4000', unitCost: '36.10' },
  ],
};

/* ------------------------------------------------------------------ */
/* URL state                                                           */
/* ------------------------------------------------------------------ */

/**
 * Short query keys. Numbers travel in canonical form — a point for the
 * decimal mark, no grouping — so a link pasted between a French and an English
 * reader means the same thing on both ends.
 */
const KEYS = {
  annualDemand: 'd',
  orderCost: 's',
  holdingCostPerUnit: 'h',
  holdingRate: 'i',
  unitCost: 'c',
  daysPerYear: 'y',
  roundingMultiple: 'm',
  averageDemand: 'dd',
  leadTime: 'l',
  demandStdDev: 'sd',
  leadTimeStdDev: 'sl',
  cycleServiceLevel: 'csl',
} as const;

type NumericKey = keyof typeof KEYS;

const VARIABILITY: Record<string, VariabilityMode> = {
  d: 'demand',
  l: 'lead-time',
  b: 'both',
};
const VARIABILITY_CODE: Record<VariabilityMode, string> = {
  demand: 'd',
  'lead-time': 'l',
  both: 'b',
};

function canonical(raw: string, locale: Locale): string | null {
  const value = parseNumber(raw, locale);
  return value === null ? null : String(value);
}

/** Encode the inputs into a query string that can be shared or bookmarked. */
export function encodeState(state: ToolState, locale: Locale): string {
  const params = new URLSearchParams();

  for (const [field, key] of Object.entries(KEYS) as Array<[NumericKey, string]>) {
    const value = canonical(state[field], locale);
    if (value !== null) params.set(key, value);
  }

  params.set('hm', state.holdingMode === 'rate' ? 'r' : 'u');
  if (state.reorderEnabled) {
    params.set('ro', '1');
    params.set('vm', VARIABILITY_CODE[state.variabilityMode]);
    params.set('pu', state.periodUnit === 'week' ? 'w' : 'd');
  }

  if (state.discountsEnabled) {
    const rows = state.priceBreaks
      .map((row) => {
        const minQty = canonical(row.minQty, locale);
        const unitCost = canonical(row.unitCost, locale);
        return minQty === null || unitCost === null ? null : `${minQty}:${unitCost}`;
      })
      .filter((row): row is string => row !== null);
    if (rows.length > 0) params.set('br', rows.join(','));
  }

  return params.toString();
}

/**
 * Read inputs back out of a query string, formatted for display in the given
 * locale. Returns null when the query carries none of our keys, so a bare URL
 * still gets the worked example.
 */
export function decodeState(search: string, locale: Locale): ToolState | null {
  const params = new URLSearchParams(search);
  const known = [...Object.values(KEYS), 'hm', 'ro', 'br'];
  if (!known.some((key) => params.has(key))) return null;

  const state: ToolState = { ...BLANK_STATE, priceBreaks: [] };

  for (const [field, key] of Object.entries(KEYS) as Array<[NumericKey, string]>) {
    const raw = params.get(key);
    if (raw === null) continue;
    // Canonical form: a point decimal mark, which English parsing reads exactly.
    const value = parseNumber(raw, 'en');
    if (value !== null) state[field] = formatForInput(value, locale);
  }

  state.holdingMode = params.get('hm') === 'r' ? 'rate' : 'perUnit';

  state.reorderEnabled = params.get('ro') === '1';
  const variability = params.get('vm');
  if (variability !== null && variability in VARIABILITY) {
    state.variabilityMode = VARIABILITY[variability];
  }
  state.periodUnit = params.get('pu') === 'w' ? 'week' : 'day';

  const breaks = params.get('br');
  if (breaks !== null && breaks !== '') {
    state.priceBreaks = breaks.split(',').map((row) => {
      const [minQty, unitCost] = row.split(':');
      const parsedQty = parseNumber(minQty ?? '', 'en');
      const parsedCost = parseNumber(unitCost ?? '', 'en');
      return {
        minQty: parsedQty === null ? '' : formatForInput(parsedQty, locale),
        unitCost: parsedCost === null ? '' : formatForInput(parsedCost, locale),
      };
    });
    state.discountsEnabled = true;
  }

  if (state.priceBreaks.length === 0) state.priceBreaks = BLANK_STATE.priceBreaks.map((r) => ({ ...r }));

  return state;
}

/** Rewrite every filled field into the conventions of another locale. */
export function reformatState(state: ToolState, from: Locale, to: Locale): ToolState {
  const convert = (raw: string): string => {
    const value = parseNumber(raw, from);
    return value === null ? raw : formatForInput(value, to);
  };

  return {
    ...state,
    annualDemand: convert(state.annualDemand),
    orderCost: convert(state.orderCost),
    holdingCostPerUnit: convert(state.holdingCostPerUnit),
    holdingRate: convert(state.holdingRate),
    unitCost: convert(state.unitCost),
    daysPerYear: convert(state.daysPerYear),
    roundingMultiple: convert(state.roundingMultiple),
    averageDemand: convert(state.averageDemand),
    leadTime: convert(state.leadTime),
    demandStdDev: convert(state.demandStdDev),
    leadTimeStdDev: convert(state.leadTimeStdDev),
    cycleServiceLevel: convert(state.cycleServiceLevel),
    priceBreaks: state.priceBreaks.map((row) => ({
      minQty: convert(row.minQty),
      unitCost: convert(row.unitCost),
    })),
  };
}
