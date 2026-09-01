/**
 * From what the user typed to what the model says.
 *
 * One pass: parse and check every field against the active locale, then feed
 * the numbers that survived into lib/eoq.ts. Nothing here does any formatting,
 * and nothing in lib/eoq.ts knows this file exists.
 */

import {
  analyseAllUnitsDiscounts,
  costPenaltyTable,
  holdingCostFromRate,
  inputSensitivityTable,
  practicalQuantity,
  solveEoq,
  solveReorderPoint,
  type CostPenaltyRow,
  type DiscountAnalysis,
  type EoqInput,
  type EoqResult,
  type HoldingBasis,
  type InputSensitivityRow,
  type PracticalQuantity,
  type PriceBreak,
  type ReorderResult,
} from './eoq';
import { parseNumber, type Locale } from './format';
import type { ToolState } from './state';
import {
  checkField,
  validatePriceBreaks,
  type FieldName,
  type FieldSpec,
  type IssueCode,
  type ScheduleIssue,
} from './validate';

export type FieldIssues = Partial<Record<FieldName, IssueCode>>;
export type FieldValues = Partial<Record<FieldName, number>>;

export interface Derived {
  values: FieldValues;
  issues: FieldIssues;
  /** Required fields still empty. Distinct from fields holding something wrong. */
  missing: FieldName[];
  scheduleIssues: ScheduleIssue[];

  holdingCostPerUnit: number | null;
  unitCost: number | null;
  basis: HoldingBasis | null;

  eoqInput: EoqInput | null;
  eoq: EoqResult | null;
  practical: PracticalQuantity | null;
  reorder: ReorderResult | null;
  discounts: DiscountAnalysis | null;
  penaltyRows: CostPenaltyRow[];
  sensitivityRows: InputSensitivityRow[];
}

/**
 * Which rule each field follows, and whether it is required, given the modes
 * currently switched on. A field that is not in play is not required, so
 * turning the reorder point off does not fill the rail with errors.
 */
export function fieldSpecs(state: ToolState): Record<FieldName, FieldSpec> {
  const byRate = state.holdingMode === 'rate';
  const reorder = state.reorderEnabled;
  const needsDemandSigma = state.variabilityMode !== 'lead-time';
  const needsLeadTimeSigma = state.variabilityMode !== 'demand';

  return {
    annualDemand: { rule: 'positive', required: true },
    orderCost: { rule: 'positive', required: true },
    holdingCostPerUnit: { rule: 'positive', required: !byRate },
    holdingRate: { rule: 'rate', required: byRate, percent: true },
    // The rate mode derives H from C, so the unit cost stops being optional.
    unitCost: { rule: 'positive', required: byRate },
    daysPerYear: { rule: 'positive', required: true },
    roundingMultiple: { rule: 'positive', required: false },
    averageDemand: { rule: 'positive', required: reorder },
    leadTime: { rule: 'positive', required: reorder },
    demandStdDev: { rule: 'nonNegative', required: reorder && needsDemandSigma },
    leadTimeStdDev: { rule: 'nonNegative', required: reorder && needsLeadTimeSigma },
    cycleServiceLevel: { rule: 'probability', required: reorder, percent: true },
  };
}

const RAW: Record<FieldName, (state: ToolState) => string> = {
  annualDemand: (s) => s.annualDemand,
  orderCost: (s) => s.orderCost,
  holdingCostPerUnit: (s) => s.holdingCostPerUnit,
  holdingRate: (s) => s.holdingRate,
  unitCost: (s) => s.unitCost,
  daysPerYear: (s) => s.daysPerYear,
  roundingMultiple: (s) => s.roundingMultiple,
  averageDemand: (s) => s.averageDemand,
  leadTime: (s) => s.leadTime,
  demandStdDev: (s) => s.demandStdDev,
  leadTimeStdDev: (s) => s.leadTimeStdDev,
  cycleServiceLevel: (s) => s.cycleServiceLevel,
};

/** Parse the price break rows. Anything unreadable becomes NaN, which the
 *  schedule check then reports rather than silently dropping. */
export function parsePriceBreaks(state: ToolState, locale: Locale): PriceBreak[] {
  return state.priceBreaks.map((row) => ({
    minQty: parseNumber(row.minQty, locale) ?? NaN,
    unitCost: parseNumber(row.unitCost, locale) ?? NaN,
  }));
}

export function derive(state: ToolState, locale: Locale): Derived {
  const specs = fieldSpecs(state);
  const values: FieldValues = {};
  const issues: FieldIssues = {};
  const missing: FieldName[] = [];

  for (const field of Object.keys(specs) as FieldName[]) {
    const { value, issue } = checkField(field, RAW[field](state), locale, specs[field]);
    if (value !== null) values[field] = value;
    if (issue !== null) {
      issues[field] = issue.code;
      if (issue.code === 'required') missing.push(field);
    }
  }

  const unitCost = values.unitCost ?? null;
  const holdingCostPerUnit =
    state.holdingMode === 'rate'
      ? values.holdingRate !== undefined && unitCost !== null
        ? holdingCostFromRate(values.holdingRate, unitCost)
        : null
      : (values.holdingCostPerUnit ?? null);

  const basis: HoldingBasis | null =
    state.holdingMode === 'rate'
      ? values.holdingRate !== undefined
        ? { kind: 'rate', rate: values.holdingRate }
        : null
      : holdingCostPerUnit !== null
        ? { kind: 'fixed', holdingCostPerUnit }
        : null;

  /* Reorder point first: its safety stock feeds the holding cost below. */
  let reorder: ReorderResult | null = null;
  if (state.reorderEnabled) {
    const averageDemand = values.averageDemand;
    const leadTime = values.leadTime;
    const cycleServiceLevel = values.cycleServiceLevel;
    if (
      averageDemand !== undefined &&
      leadTime !== undefined &&
      cycleServiceLevel !== undefined &&
      (state.variabilityMode === 'lead-time' || values.demandStdDev !== undefined) &&
      (state.variabilityMode === 'demand' || values.leadTimeStdDev !== undefined)
    ) {
      const candidate = solveReorderPoint({
        mode: state.variabilityMode,
        averageDemand,
        leadTime,
        demandStdDev: values.demandStdDev ?? 0,
        leadTimeStdDev: values.leadTimeStdDev ?? 0,
        cycleServiceLevel,
      });
      if (Number.isFinite(candidate.reorderPoint)) reorder = candidate;
    }
  }

  const annualDemand = values.annualDemand;
  const orderCost = values.orderCost;
  const daysPerYear = values.daysPerYear;

  let eoqInput: EoqInput | null = null;
  let eoq: EoqResult | null = null;
  let practical: PracticalQuantity | null = null;
  let penaltyRows: CostPenaltyRow[] = [];
  let sensitivityRows: InputSensitivityRow[] = [];

  if (
    annualDemand !== undefined &&
    orderCost !== undefined &&
    daysPerYear !== undefined &&
    holdingCostPerUnit !== null
  ) {
    eoqInput = {
      annualDemand,
      orderCost,
      holdingCostPerUnit,
      daysPerYear,
      unitCost,
      safetyStock: reorder?.safetyStock ?? 0,
    };
    eoq = solveEoq(eoqInput);
    if (values.roundingMultiple !== undefined) {
      practical = practicalQuantity(eoqInput, values.roundingMultiple);
    }
    penaltyRows = costPenaltyTable(annualDemand, orderCost, holdingCostPerUnit);
    sensitivityRows = inputSensitivityTable(annualDemand, orderCost, holdingCostPerUnit);
  }

  /* Discounts. */
  let scheduleIssues: ScheduleIssue[] = [];
  let discounts: DiscountAnalysis | null = null;
  if (state.discountsEnabled) {
    const breaks = parsePriceBreaks(state, locale);
    scheduleIssues = validatePriceBreaks(breaks);
    if (
      scheduleIssues.length === 0 &&
      annualDemand !== undefined &&
      orderCost !== undefined &&
      basis !== null
    ) {
      discounts = analyseAllUnitsDiscounts(annualDemand, orderCost, basis, breaks);
    }
  }

  return {
    values,
    issues,
    missing,
    scheduleIssues,
    holdingCostPerUnit,
    unitCost,
    basis,
    eoqInput,
    eoq,
    practical,
    reorder,
    discounts,
    penaltyRows,
    sensitivityRows,
  };
}
