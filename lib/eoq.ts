/**
 * Inventory ordering models: economic order quantity, all-units quantity
 * discounts, reorder point / safety stock, and sensitivity analysis.
 *
 * Everything here takes plain numbers and returns plain numbers or typed
 * objects. No React, no Intl, no formatting, no user-facing text. The only
 * strings are structural discriminants on result objects. Full precision is
 * kept throughout; rounding belongs to the presentation layer.
 *
 * Preconditions (D > 0, S > 0, H > 0, and so on) are enforced by
 * lib/validate.ts before these functions are called. Called with degenerate
 * input they return the natural IEEE result rather than throwing.
 */

import { inverseNormalCdf } from './stats';

/* ------------------------------------------------------------------ */
/* Classic EOQ                                                         */
/* ------------------------------------------------------------------ */

export interface EoqInput {
  /** D, annual demand in units per year. */
  annualDemand: number;
  /** S, fixed cost of placing one order. */
  orderCost: number;
  /** H, annual holding cost per unit held. */
  holdingCostPerUnit: number;
  /** Working days per year, used only to convert orders/year into days. */
  daysPerYear: number;
  /** C, unit purchase cost. Null when the user has not supplied it. */
  unitCost: number | null;
  /** SS, safety stock carried on top of cycle stock. */
  safetyStock: number;
}

export interface EoqResult {
  /** The order quantity this result was evaluated at. */
  quantity: number;
  /** The unconstrained optimum, for comparison against `quantity`. */
  optimalQuantity: number;
  ordersPerYear: number;
  daysBetweenOrders: number;
  orderingCost: number;
  /** (Q / 2) * H, the part of holding cost that depends on Q. */
  cycleHoldingCost: number;
  /** SS * H, constant with respect to Q. */
  safetyStockHoldingCost: number;
  /** cycleHoldingCost + safetyStockHoldingCost. */
  holdingCost: number;
  /** Ordering + cycle holding: the Q-dependent cost the EOQ minimises. */
  relevantCostCore: number;
  /** relevantCostCore + safety stock holding: what the buyer actually carries. */
  relevantCost: number;
  averageInventory: number;
  purchaseCost: number | null;
  totalCost: number | null;
  /** sqrt(2 * D * S * H): the closed form of relevantCostCore at Q*. */
  relevantCostClosedForm: number;
  /** True when ordering cost equals cycle holding cost at this Q. */
  costsBalanced: boolean;
}

/** H = i * C, when holding cost is expressed as a rate on unit value. */
export function holdingCostFromRate(rate: number, unitCost: number): number {
  return rate * unitCost;
}

/** Q* = sqrt(2 * D * S / H). */
export function economicOrderQuantity(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
): number {
  return Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
}

/** Annual ordering cost (D / Q) * S. */
export function annualOrderingCost(
  annualDemand: number,
  orderCost: number,
  quantity: number,
): number {
  return (annualDemand / quantity) * orderCost;
}

/** Annual cycle holding cost (Q / 2) * H. */
export function annualCycleHoldingCost(
  quantity: number,
  holdingCostPerUnit: number,
): number {
  return (quantity / 2) * holdingCostPerUnit;
}

/**
 * Total relevant cost at an arbitrary Q, excluding safety stock.
 * TRC(Q) = (D / Q) * S + (Q / 2) * H
 */
export function totalRelevantCost(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
  quantity: number,
): number {
  return (
    annualOrderingCost(annualDemand, orderCost, quantity) +
    annualCycleHoldingCost(quantity, holdingCostPerUnit)
  );
}

/** TRC at the optimum, in closed form: sqrt(2 * D * S * H). */
export function totalRelevantCostAtOptimum(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
): number {
  return Math.sqrt(2 * annualDemand * orderCost * holdingCostPerUnit);
}

const BALANCE_TOLERANCE = 1e-9;

/** Evaluate the full cost picture at any order quantity. */
export function evaluateAtQuantity(input: EoqInput, quantity: number): EoqResult {
  const { annualDemand, orderCost, holdingCostPerUnit, daysPerYear, unitCost, safetyStock } =
    input;

  const optimalQuantity = economicOrderQuantity(annualDemand, orderCost, holdingCostPerUnit);
  const ordersPerYear = annualDemand / quantity;
  const ordering = annualOrderingCost(annualDemand, orderCost, quantity);
  const cycleHolding = annualCycleHoldingCost(quantity, holdingCostPerUnit);
  const safetyHolding = safetyStock * holdingCostPerUnit;
  const relevantCostCore = ordering + cycleHolding;
  const purchaseCost = unitCost === null ? null : annualDemand * unitCost;
  const relevantCost = relevantCostCore + safetyHolding;

  const scale = Math.max(Math.abs(ordering), Math.abs(cycleHolding), 1);

  return {
    quantity,
    optimalQuantity,
    ordersPerYear,
    daysBetweenOrders: daysPerYear / ordersPerYear,
    orderingCost: ordering,
    cycleHoldingCost: cycleHolding,
    safetyStockHoldingCost: safetyHolding,
    holdingCost: cycleHolding + safetyHolding,
    relevantCostCore,
    relevantCost,
    averageInventory: quantity / 2 + safetyStock,
    purchaseCost,
    totalCost: purchaseCost === null ? null : relevantCost + purchaseCost,
    relevantCostClosedForm: totalRelevantCostAtOptimum(
      annualDemand,
      orderCost,
      holdingCostPerUnit,
    ),
    costsBalanced: Math.abs(ordering - cycleHolding) / scale < BALANCE_TOLERANCE,
  };
}

/** Evaluate at the unconstrained optimum Q*. */
export function solveEoq(input: EoqInput): EoqResult {
  return evaluateAtQuantity(
    input,
    economicOrderQuantity(input.annualDemand, input.orderCost, input.holdingCostPerUnit),
  );
}

/* ------------------------------------------------------------------ */
/* Practical order quantity: rounding to a case pack / pallet / MOQ     */
/* ------------------------------------------------------------------ */

export interface PracticalQuantity {
  multiple: number;
  /** Q* rounded up to the next whole multiple. */
  quantity: number;
  relevantCostCore: number;
  optimalRelevantCostCore: number;
  /** Extra annual cost of ordering the rounded quantity instead of Q*. */
  penalty: number;
  /** Same penalty as a percentage of the optimum. */
  penaltyPercent: number;
  /** True when Q* already sits on the multiple. */
  alreadyOnMultiple: boolean;
}

/** Round up, tolerating the float noise that makes 700 / 100 land at 6.9999999. */
export function roundUpToMultiple(value: number, multiple: number): number {
  if (!(multiple > 0)) return value;
  return Math.ceil(value / multiple - 1e-9) * multiple;
}

export function practicalQuantity(input: EoqInput, multiple: number): PracticalQuantity | null {
  if (!(multiple > 0)) return null;

  const { annualDemand, orderCost, holdingCostPerUnit } = input;
  const optimum = economicOrderQuantity(annualDemand, orderCost, holdingCostPerUnit);
  const rounded = roundUpToMultiple(optimum, multiple);

  const optimalCost = totalRelevantCost(annualDemand, orderCost, holdingCostPerUnit, optimum);
  const roundedCost = totalRelevantCost(annualDemand, orderCost, holdingCostPerUnit, rounded);

  return {
    multiple,
    quantity: rounded,
    relevantCostCore: roundedCost,
    optimalRelevantCostCore: optimalCost,
    penalty: roundedCost - optimalCost,
    penaltyPercent: (roundedCost / optimalCost - 1) * 100,
    alreadyOnMultiple: Math.abs(rounded - optimum) < 1e-9,
  };
}

/* ------------------------------------------------------------------ */
/* All-units quantity discounts                                         */
/* ------------------------------------------------------------------ */

export interface PriceBreak {
  /** Lowest quantity that earns this tier's unit cost. */
  minQty: number;
  unitCost: number;
}

/**
 * How holding cost is derived. When it is a rate on unit value, each discount
 * tier carries its own H, which is what makes the discount comparison
 * interesting; when it is a flat currency amount, H is the same everywhere.
 */
export type HoldingBasis =
  | { kind: 'fixed'; holdingCostPerUnit: number }
  | { kind: 'rate'; rate: number };

export function holdingCostForTier(basis: HoldingBasis, unitCost: number): number {
  return basis.kind === 'fixed'
    ? basis.holdingCostPerUnit
    : holdingCostFromRate(basis.rate, unitCost);
}

export interface DiscountTier {
  index: number;
  minQty: number;
  /** Displayed upper bound, next tier's minQty - 1. Null on the last tier. */
  maxQty: number | null;
  /** Exclusive upper bound used for the feasibility test. Null on the last tier. */
  upperBoundExclusive: number | null;
  unitCost: number;
  holdingCostPerUnit: number;
  /** Qj, this tier's unconstrained EOQ at this tier's price. */
  tierEoq: number;
  candidateQuantity: number | null;
  status: 'eoq-in-range' | 'raised-to-break' | 'infeasible';
  purchaseCost: number | null;
  orderingCost: number | null;
  holdingCost: number | null;
  totalCost: number | null;
}

export interface DiscountAnalysis {
  tiers: DiscountTier[];
  bestIndex: number | null;
  best: DiscountTier | null;
}

/**
 * All-units discounts: reaching a break re-prices the entire order, not just
 * the units above the break. Incremental-discount schedules behave differently
 * and are deliberately not implemented here.
 *
 * Tier j covers quantities [minQty_j, minQty_{j+1}). The displayed upper bound
 * is minQty_{j+1} - 1 because orders are placed in whole units, but the
 * feasibility test uses the exclusive bound so a fractional Q* sitting just
 * below a break stays inside its own tier.
 *
 * Assumes a schedule already checked by validatePriceBreaks in lib/validate.ts.
 */
export function analyseAllUnitsDiscounts(
  annualDemand: number,
  orderCost: number,
  basis: HoldingBasis,
  breaks: readonly PriceBreak[],
): DiscountAnalysis {
  const tiers: DiscountTier[] = breaks.map((tier, index) => {
    const next = breaks[index + 1];
    const upperBoundExclusive = next === undefined ? null : next.minQty;
    const maxQty = next === undefined ? null : next.minQty - 1;
    const holdingCostPerUnit = holdingCostForTier(basis, tier.unitCost);
    const tierEoq = economicOrderQuantity(annualDemand, orderCost, holdingCostPerUnit);

    let candidateQuantity: number | null;
    let status: DiscountTier['status'];

    if (tierEoq < tier.minQty) {
      // Below the break: buying up to the break is the cheapest way into this tier.
      candidateQuantity = tier.minQty;
      status = 'raised-to-break';
    } else if (upperBoundExclusive !== null && tierEoq >= upperBoundExclusive) {
      // This tier's own optimum lies outside the range where its price applies.
      candidateQuantity = null;
      status = 'infeasible';
    } else {
      candidateQuantity = tierEoq;
      status = 'eoq-in-range';
    }

    if (candidateQuantity === null) {
      return {
        index,
        minQty: tier.minQty,
        maxQty,
        upperBoundExclusive,
        unitCost: tier.unitCost,
        holdingCostPerUnit,
        tierEoq,
        candidateQuantity: null,
        status,
        purchaseCost: null,
        orderingCost: null,
        holdingCost: null,
        totalCost: null,
      };
    }

    const purchaseCost = annualDemand * tier.unitCost;
    const ordering = annualOrderingCost(annualDemand, orderCost, candidateQuantity);
    const holding = annualCycleHoldingCost(candidateQuantity, holdingCostPerUnit);

    return {
      index,
      minQty: tier.minQty,
      maxQty,
      upperBoundExclusive,
      unitCost: tier.unitCost,
      holdingCostPerUnit,
      tierEoq,
      candidateQuantity,
      status,
      purchaseCost,
      orderingCost: ordering,
      holdingCost: holding,
      totalCost: purchaseCost + ordering + holding,
    };
  });

  let bestIndex: number | null = null;
  let bestCost = Infinity;
  for (const tier of tiers) {
    if (tier.totalCost === null) continue;
    if (tier.totalCost < bestCost) {
      bestCost = tier.totalCost;
      bestIndex = tier.index;
    }
  }

  return { tiers, bestIndex, best: bestIndex === null ? null : tiers[bestIndex] };
}

/* ------------------------------------------------------------------ */
/* Reorder point and safety stock                                       */
/* ------------------------------------------------------------------ */

/** Which source of variability the reorder point accounts for. */
export type VariabilityMode = 'demand' | 'lead-time' | 'both';

export interface ReorderInput {
  mode: VariabilityMode;
  /** d-bar, average demand per period. */
  averageDemand: number;
  /** L, lead time in the same periods as demand. */
  leadTime: number;
  /** Standard deviation of demand per period. */
  demandStdDev: number;
  /** Standard deviation of lead time, in periods. */
  leadTimeStdDev: number;
  /**
   * Cycle service level as a fraction: the probability of not stocking out
   * during a replenishment cycle. This is not fill rate.
   */
  cycleServiceLevel: number;
}

export interface ReorderResult {
  /** Safety factor z for the cycle service level. */
  z: number;
  /** Standard deviation of demand during lead time. */
  sigmaDdlt: number;
  safetyStock: number;
  demandDuringLeadTime: number;
  reorderPoint: number;
}

/** Standard deviation of demand during lead time, by variability mode. */
export function sigmaDemandDuringLeadTime(
  mode: VariabilityMode,
  averageDemand: number,
  leadTime: number,
  demandStdDev: number,
  leadTimeStdDev: number,
): number {
  switch (mode) {
    case 'demand':
      return demandStdDev * Math.sqrt(leadTime);
    case 'lead-time':
      return averageDemand * leadTimeStdDev;
    case 'both':
      return Math.sqrt(
        leadTime * demandStdDev * demandStdDev +
          averageDemand * averageDemand * leadTimeStdDev * leadTimeStdDev,
      );
  }
}

export function solveReorderPoint(input: ReorderInput): ReorderResult {
  const z = inverseNormalCdf(input.cycleServiceLevel);
  const sigmaDdlt = sigmaDemandDuringLeadTime(
    input.mode,
    input.averageDemand,
    input.leadTime,
    input.demandStdDev,
    input.leadTimeStdDev,
  );
  const safetyStock = z * sigmaDdlt;
  const demandDuringLeadTime = input.averageDemand * input.leadTime;

  return {
    z,
    sigmaDdlt,
    safetyStock,
    demandDuringLeadTime,
    reorderPoint: demandDuringLeadTime + safetyStock,
  };
}

/* ------------------------------------------------------------------ */
/* Sensitivity analysis                                                 */
/* ------------------------------------------------------------------ */

/** Q / Q* ratios for the cost-penalty table. */
export const COST_PENALTY_RATIOS = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0,
] as const;

export interface CostPenaltyRow {
  ratio: number;
  quantity: number;
  relevantCost: number;
  /** TRC(Q) / TRC(Q*), which equals 0.5 * (ratio + 1 / ratio). */
  costRatio: number;
  penaltyPercent: number;
  isOptimum: boolean;
}

/**
 * The EOQ cost curve is flat near its minimum:
 * TRC(Q) / TRC(Q*) = 0.5 * (Q / Q* + Q* / Q)
 * Ordering 20% away from the optimum costs about 2% more.
 */
export function costPenaltyRatio(ratio: number): number {
  return 0.5 * (ratio + 1 / ratio);
}

export function costPenaltyTable(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
  ratios: readonly number[] = COST_PENALTY_RATIOS,
): CostPenaltyRow[] {
  const optimum = economicOrderQuantity(annualDemand, orderCost, holdingCostPerUnit);
  const optimalCost = totalRelevantCostAtOptimum(annualDemand, orderCost, holdingCostPerUnit);

  return ratios.map((ratio) => {
    const costRatio = costPenaltyRatio(ratio);
    return {
      ratio,
      quantity: optimum * ratio,
      relevantCost: optimalCost * costRatio,
      costRatio,
      penaltyPercent: (costRatio - 1) * 100,
      isOptimum: ratio === 1,
    };
  });
}

/** Relative errors applied to each input in the second sensitivity table. */
export const INPUT_DEVIATIONS = [-0.2, -0.1, 0, 0.1, 0.2] as const;

export type SensitivityParameter = 'annualDemand' | 'orderCost' | 'holdingCostPerUnit';

export const SENSITIVITY_PARAMETERS: readonly SensitivityParameter[] = [
  'annualDemand',
  'orderCost',
  'holdingCostPerUnit',
];

export interface InputSensitivityRow {
  parameter: SensitivityParameter;
  /** Relative change applied, as a fraction: -0.2 is a 20% underestimate. */
  deviation: number;
  parameterValue: number;
  quantity: number;
  relevantCost: number;
  quantityChangePercent: number;
  relevantCostChangePercent: number;
  isBaseline: boolean;
}

/**
 * Vary D, S and H one at a time. Because Q* is proportional to sqrt(D),
 * sqrt(S) and 1 / sqrt(H), a 20% error in an input moves Q* by about 10%.
 */
export function inputSensitivityTable(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
  deviations: readonly number[] = INPUT_DEVIATIONS,
): InputSensitivityRow[] {
  const baseQuantity = economicOrderQuantity(annualDemand, orderCost, holdingCostPerUnit);
  const baseCost = totalRelevantCostAtOptimum(annualDemand, orderCost, holdingCostPerUnit);
  const base: Record<SensitivityParameter, number> = {
    annualDemand,
    orderCost,
    holdingCostPerUnit,
  };

  const rows: InputSensitivityRow[] = [];
  for (const parameter of SENSITIVITY_PARAMETERS) {
    for (const deviation of deviations) {
      const parameterValue = base[parameter] * (1 + deviation);
      const values = { ...base, [parameter]: parameterValue };
      const quantity = economicOrderQuantity(
        values.annualDemand,
        values.orderCost,
        values.holdingCostPerUnit,
      );
      const relevantCost = totalRelevantCostAtOptimum(
        values.annualDemand,
        values.orderCost,
        values.holdingCostPerUnit,
      );
      rows.push({
        parameter,
        deviation,
        parameterValue,
        quantity,
        relevantCost,
        quantityChangePercent: (quantity / baseQuantity - 1) * 100,
        relevantCostChangePercent: (relevantCost / baseCost - 1) * 100,
        isBaseline: deviation === 0,
      });
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Curve sampling for the chart                                         */
/* ------------------------------------------------------------------ */

export interface CurvePoint {
  quantity: number;
  ordering: number;
  holding: number;
  total: number;
}

/** Sample the three classic cost curves across a quantity range. */
export function sampleCostCurve(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number,
  from: number,
  to: number,
  steps: number,
): CurvePoint[] {
  const points: CurvePoint[] = [];
  const span = to - from;
  for (let index = 0; index <= steps; index += 1) {
    const quantity = from + (span * index) / steps;
    if (quantity <= 0) continue;
    const ordering = annualOrderingCost(annualDemand, orderCost, quantity);
    const holding = annualCycleHoldingCost(quantity, holdingCostPerUnit);
    points.push({ quantity, ordering, holding, total: ordering + holding });
  }
  return points;
}

export interface DiscountCurveSegment {
  tierIndex: number;
  unitCost: number;
  /** Left end of the drawn segment, clipped to the visible window. */
  from: number;
  /** Right end of the drawn segment, clipped to the visible window. */
  to: number;
  /**
   * The segment starts where its tier starts, so the price break is reached
   * here and the endpoint belongs to this segment: draw it closed. False when
   * the tier began off the left edge of the chart.
   */
  startsAtBreak: boolean;
  /**
   * The segment stops where the next tier starts, so this price no longer
   * applies at that quantity: draw the endpoint open. False on the last tier
   * and wherever the chart edge cut the segment short.
   */
  endsAtBreak: boolean;
  points: { quantity: number; total: number }[];
}

/**
 * Sample the all-units total-cost curve, which is discontinuous: reaching a
 * break re-prices the whole order, so the curve drops at each minQty. Each
 * segment is returned separately with its endpoint openness, so the chart can
 * draw a closed dot where a tier starts and an open dot where it stops.
 */
export function sampleDiscountCurve(
  annualDemand: number,
  orderCost: number,
  basis: HoldingBasis,
  breaks: readonly PriceBreak[],
  chartMin: number,
  chartMax: number,
  stepsPerSegment: number,
): DiscountCurveSegment[] {
  const segments: DiscountCurveSegment[] = [];

  breaks.forEach((tier, index) => {
    const next = breaks[index + 1];
    const tierEnd = next === undefined ? chartMax : next.minQty;

    // Clip to the window the chart is actually showing, so a tier that starts
    // off the left edge is drawn from the edge rather than from its own break.
    const from = Math.max(tier.minQty, chartMin);
    const to = Math.min(tierEnd, chartMax);
    if (to <= from) return;

    const holdingCostPerUnit = holdingCostForTier(basis, tier.unitCost);
    const purchase = annualDemand * tier.unitCost;
    const points: { quantity: number; total: number }[] = [];

    for (let step = 0; step <= stepsPerSegment; step += 1) {
      const quantity = from + ((to - from) * step) / stepsPerSegment;
      if (quantity <= 0) continue;
      points.push({
        quantity,
        total:
          purchase +
          annualOrderingCost(annualDemand, orderCost, quantity) +
          annualCycleHoldingCost(quantity, holdingCostPerUnit),
      });
    }

    segments.push({
      tierIndex: index,
      unitCost: tier.unitCost,
      from,
      to,
      startsAtBreak: from === tier.minQty,
      endsAtBreak: next !== undefined && to === tierEnd,
      points,
    });
  });

  return segments;
}
