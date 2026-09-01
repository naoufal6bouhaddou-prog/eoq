/**
 * Input validation, kept apart from both the maths and the UI.
 *
 * Validation returns typed codes rather than sentences. The dictionaries in
 * lib/i18n turn a code into a message, so the same rule reads correctly in
 * French and in English and neither copy nor translation can drift away from
 * the rule it describes.
 */

import type { PriceBreak } from './eoq';
import { parseNumber, type Locale } from './format';

export type FieldName =
  | 'annualDemand'
  | 'orderCost'
  | 'holdingCostPerUnit'
  | 'holdingRate'
  | 'unitCost'
  | 'daysPerYear'
  | 'roundingMultiple'
  | 'averageDemand'
  | 'leadTime'
  | 'demandStdDev'
  | 'leadTimeStdDev'
  | 'cycleServiceLevel';

export type IssueCode =
  | 'required'
  | 'not-a-number'
  | 'must-be-positive'
  | 'must-be-non-negative'
  | 'rate-out-of-range'
  | 'service-level-out-of-range';

export interface FieldIssue {
  field: FieldName;
  code: IssueCode;
}

/**
 * What a field is allowed to hold.
 *   positive     strictly greater than zero
 *   nonNegative  zero or more
 *   rate         a share of unit value: greater than 0, at most 1
 *   probability  strictly between 0 and 1, because a 100% cycle service level
 *                needs infinite safety stock and is not attainable
 */
export type FieldRule = 'positive' | 'nonNegative' | 'rate' | 'probability';

export interface FieldSpec {
  rule: FieldRule;
  required: boolean;
}

export interface FieldCheck {
  value: number | null;
  issue: FieldIssue | null;
}

/** Parse and check one field. An empty optional field is valid and yields null. */
export function checkField(
  field: FieldName,
  raw: string,
  locale: Locale,
  { rule, required }: FieldSpec,
): FieldCheck {
  if (raw.trim() === '') {
    return required ? { value: null, issue: { field, code: 'required' } } : { value: null, issue: null };
  }

  const value = parseNumber(raw, locale);
  if (value === null) return { value: null, issue: { field, code: 'not-a-number' } };

  switch (rule) {
    case 'positive':
      if (!(value > 0)) return { value: null, issue: { field, code: 'must-be-positive' } };
      break;
    case 'nonNegative':
      if (!(value >= 0)) return { value: null, issue: { field, code: 'must-be-non-negative' } };
      break;
    case 'rate':
      if (!(value > 0 && value <= 1)) {
        return { value: null, issue: { field, code: 'rate-out-of-range' } };
      }
      break;
    case 'probability':
      if (!(value > 0 && value < 1)) {
        return { value: null, issue: { field, code: 'service-level-out-of-range' } };
      }
      break;
  }

  return { value, issue: null };
}

/* ------------------------------------------------------------------ */
/* Price break schedule                                                */
/* ------------------------------------------------------------------ */

export type ScheduleIssueCode =
  | 'schedule-empty'
  | 'first-tier-must-start-at-one'
  | 'min-qty-must-be-whole-and-positive'
  | 'min-qty-must-ascend'
  | 'unit-cost-must-be-positive';

export interface ScheduleIssue {
  code: ScheduleIssueCode;
  /** Index of the offending row, or null when the whole schedule is at fault. */
  row: number | null;
}

/**
 * A well-formed all-units schedule starts at quantity 1, rises strictly, and
 * prices every tier above zero. Anything else would make the tier ranges
 * overlap or leave a gap, so it is reported rather than repaired.
 */
export function validatePriceBreaks(breaks: readonly PriceBreak[]): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];

  if (breaks.length === 0) {
    return [{ code: 'schedule-empty', row: null }];
  }

  breaks.forEach((tier, index) => {
    if (!Number.isFinite(tier.minQty) || !Number.isInteger(tier.minQty) || tier.minQty < 1) {
      issues.push({ code: 'min-qty-must-be-whole-and-positive', row: index });
    } else if (index === 0 && tier.minQty !== 1) {
      issues.push({ code: 'first-tier-must-start-at-one', row: 0 });
    }

    if (!Number.isFinite(tier.unitCost) || tier.unitCost <= 0) {
      issues.push({ code: 'unit-cost-must-be-positive', row: index });
    }

    const previous = breaks[index - 1];
    if (previous !== undefined && tier.minQty <= previous.minQty) {
      issues.push({ code: 'min-qty-must-ascend', row: index });
    }
  });

  return issues;
}
