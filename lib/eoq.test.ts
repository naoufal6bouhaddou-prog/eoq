import { describe, expect, it } from 'vitest';

import {
  analyseAllUnitsDiscounts,
  costPenaltyRatio,
  costPenaltyTable,
  economicOrderQuantity,
  evaluateAtQuantity,
  holdingCostFromRate,
  inputSensitivityTable,
  practicalQuantity,
  roundUpToMultiple,
  sampleDiscountCurve,
  sigmaDemandDuringLeadTime,
  solveEoq,
  solveReorderPoint,
  totalRelevantCost,
  totalRelevantCostAtOptimum,
  type EoqInput,
  type PriceBreak,
} from './eoq';

/** The tool's stated inputs, with the optional ones switched off. */
function input(overrides: Partial<EoqInput> = {}): EoqInput {
  return {
    annualDemand: 10_000,
    orderCost: 50,
    holdingCostPerUnit: 2,
    daysPerYear: 365,
    unitCost: null,
    safetyStock: 0,
    ...overrides,
  };
}

/* ================================================================== */
/* Verification case 1: D=10000, S=50, H=2                            */
/* ================================================================== */

describe('verification case 1 — D=10000, S=50, H=2', () => {
  const result = solveEoq(input());

  it('gives Q* = 707.11', () => {
    expect(result.quantity).toBeCloseTo(707.11, 2);
    expect(result.quantity).toBeCloseTo(Math.sqrt(500_000), 10);
  });

  it('gives N = 14.14 orders per year', () => {
    expect(result.ordersPerYear).toBeCloseTo(14.14, 2);
  });

  it('gives TRC = 1414.21', () => {
    expect(result.relevantCost).toBeCloseTo(1414.21, 2);
  });

  it('splits that cost evenly: Cord = Chold = 707.11', () => {
    expect(result.orderingCost).toBeCloseTo(707.11, 2);
    expect(result.cycleHoldingCost).toBeCloseTo(707.11, 2);
  });

  it('reports the balance between ordering and holding cost', () => {
    expect(result.costsBalanced).toBe(true);
  });

  it('spaces orders 25.8 days apart on a 365-day year', () => {
    expect(result.daysBetweenOrders).toBeCloseTo(365 / 14.142135, 3);
  });

  it('rescales the cycle when the working year is 250 days', () => {
    const shorter = solveEoq(input({ daysPerYear: 250 }));
    expect(shorter.quantity).toBeCloseTo(result.quantity, 10);
    expect(shorter.daysBetweenOrders).toBeCloseTo(250 / 14.142135, 3);
  });
});

/* ================================================================== */
/* Verification case 2: D=1200, S=25, i=0.20, C=5                     */
/* ================================================================== */

describe('verification case 2 — D=1200, S=25, i=0.20, C=5', () => {
  const holdingCostPerUnit = holdingCostFromRate(0.2, 5);
  const result = solveEoq(
    input({ annualDemand: 1200, orderCost: 25, holdingCostPerUnit, unitCost: 5 }),
  );

  it('derives H = 1.00 from the rate and the unit cost', () => {
    expect(holdingCostPerUnit).toBeCloseTo(1, 12);
  });

  it('gives Q* = 244.95', () => {
    expect(result.quantity).toBeCloseTo(244.95, 2);
  });

  it('gives TRC = 244.95', () => {
    expect(result.relevantCost).toBeCloseTo(244.95, 2);
  });

  it('adds the purchase cost when C is known', () => {
    expect(result.purchaseCost).toBeCloseTo(6000, 6);
    expect(result.totalCost).toBeCloseTo(6000 + 244.9489743, 6);
  });
});

/* ================================================================== */
/* Verification case 3: safety stock and reorder point                */
/* ================================================================== */

describe('verification case 3 — d=50/day, sigma_d=8, L=9 days, CSL=95%', () => {
  const result = solveReorderPoint({
    mode: 'demand',
    averageDemand: 50,
    leadTime: 9,
    demandStdDev: 8,
    leadTimeStdDev: 0,
    cycleServiceLevel: 0.95,
  });

  it('gives sigma over the lead time = 24.00', () => {
    expect(result.sigmaDdlt).toBeCloseTo(24, 10);
  });

  it('gives safety stock = 39.48, which a buyer orders as 40', () => {
    expect(result.safetyStock).toBeCloseTo(39.48, 2);
    expect(Math.ceil(result.safetyStock)).toBe(40);
  });

  it('gives a reorder point of 489.48, which a buyer sets at 490', () => {
    expect(result.reorderPoint).toBeCloseTo(489.48, 2);
    expect(Math.ceil(result.reorderPoint)).toBe(490);
  });
});

/* ================================================================== */
/* The two properties that must hold at the optimum                   */
/* ================================================================== */

describe('properties at Q*', () => {
  const cases: Array<[number, number, number]> = [
    [10_000, 50, 2],
    [1200, 25, 1],
    [37, 3.5, 0.4],
    [980_000, 1250, 17.5],
  ];

  it.each(cases)('ordering cost equals holding cost (D=%i, S=%i, H=%i)', (d, s, h) => {
    const result = solveEoq(input({ annualDemand: d, orderCost: s, holdingCostPerUnit: h }));
    expect(result.orderingCost).toBeCloseTo(result.cycleHoldingCost, 8);
    expect(result.costsBalanced).toBe(true);
  });

  it.each(cases)('TRC equals sqrt(2 D S H) (D=%i, S=%i, H=%i)', (d, s, h) => {
    const result = solveEoq(input({ annualDemand: d, orderCost: s, holdingCostPerUnit: h }));
    expect(result.relevantCostCore).toBeCloseTo(Math.sqrt(2 * d * s * h), 8);
    expect(result.relevantCostCore).toBeCloseTo(result.relevantCostClosedForm, 8);
  });

  it.each(cases)('Q* is the minimum of TRC (D=%i, S=%i, H=%i)', (d, s, h) => {
    const optimum = economicOrderQuantity(d, s, h);
    const best = totalRelevantCost(d, s, h, optimum);
    for (const factor of [0.5, 0.9, 0.99, 1.01, 1.1, 2]) {
      expect(totalRelevantCost(d, s, h, optimum * factor)).toBeGreaterThan(best);
    }
  });

  it('is flagged as unbalanced away from the optimum', () => {
    expect(evaluateAtQuantity(input(), 500).costsBalanced).toBe(false);
  });
});

/* ================================================================== */
/* Safety stock feeds back into the totals                            */
/* ================================================================== */

describe('safety stock in the cost totals', () => {
  const withSafetyStock = solveEoq(input({ safetyStock: 40 }));

  it('carries Q/2 + SS on average', () => {
    expect(withSafetyStock.averageInventory).toBeCloseTo(707.1067812 / 2 + 40, 6);
  });

  it('charges holding cost on the safety stock', () => {
    expect(withSafetyStock.safetyStockHoldingCost).toBeCloseTo(80, 8);
    expect(withSafetyStock.holdingCost).toBeCloseTo(707.1067812 + 80, 6);
  });

  it('leaves the Q-dependent cost untouched, so Q* does not move', () => {
    expect(withSafetyStock.relevantCostCore).toBeCloseTo(1414.2135624, 6);
    expect(withSafetyStock.relevantCost).toBeCloseTo(1414.2135624 + 80, 6);
    expect(withSafetyStock.quantity).toBeCloseTo(solveEoq(input()).quantity, 10);
  });
});

/* ================================================================== */
/* Practical order quantity                                           */
/* ================================================================== */

describe('rounding to a case pack', () => {
  it('rounds up, never down', () => {
    expect(roundUpToMultiple(707.1067812, 100)).toBe(800);
    expect(roundUpToMultiple(707.1067812, 50)).toBe(750);
    expect(roundUpToMultiple(707.1067812, 1)).toBe(708);
  });

  it('leaves a quantity that already sits on the multiple alone', () => {
    expect(roundUpToMultiple(700, 100)).toBe(700);
    expect(roundUpToMultiple(2400, 12)).toBe(2400);
  });

  it('prices the penalty of a 100-unit pallet at 0.8%', () => {
    const result = practicalQuantity(input(), 100);
    expect(result).not.toBeNull();
    expect(result?.quantity).toBe(800);
    expect(result?.relevantCostCore).toBeCloseTo(1425, 6);
    expect(result?.penalty).toBeCloseTo(10.7864376, 5);
    expect(result?.penaltyPercent).toBeCloseTo(0.7627, 3);
    expect(result?.alreadyOnMultiple).toBe(false);
  });

  it('reports no penalty when Q* already lands on the multiple', () => {
    // D = 9800 puts Q* at exactly 700, which is a whole number of 70s.
    const result = practicalQuantity(
      input({ annualDemand: 9800, orderCost: 50, holdingCostPerUnit: 2 }),
      70,
    );
    expect(result?.quantity).toBe(700);
    expect(result?.alreadyOnMultiple).toBe(true);
    expect(result?.penalty).toBeCloseTo(0, 8);
  });

  it('declines a multiple of zero rather than dividing by it', () => {
    expect(practicalQuantity(input(), 0)).toBeNull();
  });
});

/* ================================================================== */
/* All-units quantity discounts                                       */
/* ================================================================== */

describe('all-units discounts with a cost-dependent holding rate', () => {
  const breaks: PriceBreak[] = [
    { minQty: 1, unitCost: 5.0 },
    { minQty: 1000, unitCost: 4.85 },
    { minQty: 2000, unitCost: 4.75 },
  ];
  const analysis = analyseAllUnitsDiscounts(5000, 49, { kind: 'rate', rate: 0.2 }, breaks);

  it('gives each tier its own holding cost', () => {
    expect(analysis.tiers[0].holdingCostPerUnit).toBeCloseTo(1.0, 10);
    expect(analysis.tiers[1].holdingCostPerUnit).toBeCloseTo(0.97, 10);
    expect(analysis.tiers[2].holdingCostPerUnit).toBeCloseTo(0.95, 10);
  });

  it('keeps tier 1 at its own EOQ of 700', () => {
    expect(analysis.tiers[0].tierEoq).toBeCloseTo(700, 8);
    expect(analysis.tiers[0].candidateQuantity).toBeCloseTo(700, 8);
    expect(analysis.tiers[0].status).toBe('eoq-in-range');
    expect(analysis.tiers[0].totalCost).toBeCloseTo(25_700, 6);
  });

  it('buys tier 2 up to its break at 1000', () => {
    expect(analysis.tiers[1].tierEoq).toBeCloseTo(710.74, 2);
    expect(analysis.tiers[1].candidateQuantity).toBe(1000);
    expect(analysis.tiers[1].status).toBe('raised-to-break');
    expect(analysis.tiers[1].totalCost).toBeCloseTo(24_980, 6);
  });

  it('buys tier 3 up to its break at 2000', () => {
    expect(analysis.tiers[2].candidateQuantity).toBe(2000);
    expect(analysis.tiers[2].status).toBe('raised-to-break');
    expect(analysis.tiers[2].totalCost).toBeCloseTo(24_822.5, 6);
  });

  it('recommends the cheapest tier overall, not the cheapest unit price alone', () => {
    expect(analysis.bestIndex).toBe(2);
    expect(analysis.best?.totalCost).toBeCloseTo(24_822.5, 6);
  });

  it('reports the displayed upper bound one unit below the next break', () => {
    expect(analysis.tiers[0].maxQty).toBe(999);
    expect(analysis.tiers[1].maxQty).toBe(1999);
    expect(analysis.tiers[2].maxQty).toBeNull();
  });

  it('adds purchase, ordering and holding to the tier total', () => {
    const tier = analysis.tiers[0];
    expect((tier.purchaseCost ?? 0) + (tier.orderingCost ?? 0) + (tier.holdingCost ?? 0)).toBeCloseTo(
      tier.totalCost ?? 0,
      8,
    );
  });
});

describe('all-units discounts with a flat holding cost', () => {
  const breaks: PriceBreak[] = [
    { minQty: 1, unitCost: 10 },
    { minQty: 100, unitCost: 9.5 },
    { minQty: 500, unitCost: 9 },
  ];
  const analysis = analyseAllUnitsDiscounts(
    10_000,
    50,
    { kind: 'fixed', holdingCostPerUnit: 2 },
    breaks,
  );

  it('gives every tier the same EOQ', () => {
    for (const tier of analysis.tiers) expect(tier.tierEoq).toBeCloseTo(707.1067812, 6);
  });

  it('discards tiers whose EOQ sits above their own price range', () => {
    expect(analysis.tiers[0].status).toBe('infeasible');
    expect(analysis.tiers[0].totalCost).toBeNull();
    expect(analysis.tiers[1].status).toBe('infeasible');
    expect(analysis.tiers[1].totalCost).toBeNull();
  });

  it('settles on the unbounded tier, where the EOQ is feasible', () => {
    expect(analysis.tiers[2].status).toBe('eoq-in-range');
    expect(analysis.tiers[2].candidateQuantity).toBeCloseTo(707.1067812, 6);
    expect(analysis.bestIndex).toBe(2);
    expect(analysis.best?.totalCost).toBeCloseTo(90_000 + 1414.2135624, 5);
  });
});

describe('tier ranges are half-open, so a fractional Q just under a break stays put', () => {
  // D * S chosen so that Q* lands on exactly 99.5 with H = 2.
  const analysis = analyseAllUnitsDiscounts(
    9900.25,
    1,
    { kind: 'fixed', holdingCostPerUnit: 2 },
    [
      { minQty: 1, unitCost: 10 },
      { minQty: 100, unitCost: 9 },
    ],
  );

  it('places Q* = 99.5 inside the tier that runs to 99', () => {
    expect(analysis.tiers[0].tierEoq).toBeCloseTo(99.5, 10);
    expect(analysis.tiers[0].maxQty).toBe(99);
    expect(analysis.tiers[0].status).toBe('eoq-in-range');
    expect(analysis.tiers[0].candidateQuantity).toBeCloseTo(99.5, 10);
  });

  it('marks a tier infeasible only once Q* reaches the next break', () => {
    const atBreak = analyseAllUnitsDiscounts(
      5000,
      1,
      { kind: 'fixed', holdingCostPerUnit: 1 },
      [
        { minQty: 1, unitCost: 10 },
        { minQty: 100, unitCost: 9 },
      ],
    );
    expect(atBreak.tiers[0].tierEoq).toBeCloseTo(100, 10);
    expect(atBreak.tiers[0].status).toBe('infeasible');
  });
});

describe('the discount cost curve', () => {
  const breaks: PriceBreak[] = [
    { minQty: 1, unitCost: 5.0 },
    { minQty: 1000, unitCost: 4.85 },
  ];
  const segments = sampleDiscountCurve(5000, 49, { kind: 'rate', rate: 0.2 }, breaks, 1, 3000, 40);

  it('returns one segment per tier', () => {
    expect(segments).toHaveLength(2);
    expect(segments[0].from).toBe(1);
    expect(segments[0].to).toBe(1000);
    expect(segments[1].from).toBe(1000);
    expect(segments[1].to).toBe(3000);
  });

  it('marks a segment closed where its tier starts and open where the next begins', () => {
    expect(segments[0].startsAtBreak).toBe(true);
    expect(segments[0].endsAtBreak).toBe(true);
    // The last tier runs off the edge of the chart, not into another break.
    expect(segments[1].endsAtBreak).toBe(false);
  });

  it('clips to the visible window instead of drawing off the edge', () => {
    const clipped = sampleDiscountCurve(
      5000,
      49,
      { kind: 'rate', rate: 0.2 },
      breaks,
      600,
      1400,
      20,
    );
    expect(clipped[0].from).toBe(600);
    expect(clipped[0].startsAtBreak).toBe(false);
    expect(clipped[0].to).toBe(1000);
    expect(clipped[0].endsAtBreak).toBe(true);
    expect(clipped[1].from).toBe(1000);
    expect(clipped[1].startsAtBreak).toBe(true);
    expect(clipped[1].to).toBe(1400);
    for (const point of clipped.flatMap((segment) => segment.points)) {
      expect(point.quantity).toBeGreaterThanOrEqual(600);
      expect(point.quantity).toBeLessThanOrEqual(1400);
    }
  });

  it('drops a tier entirely when it falls outside the window', () => {
    const narrow = sampleDiscountCurve(
      5000,
      49,
      { kind: 'rate', rate: 0.2 },
      breaks,
      1200,
      2000,
      20,
    );
    expect(narrow).toHaveLength(1);
    expect(narrow[0].tierIndex).toBe(1);
  });

  it('drops at the price break rather than joining up', () => {
    const endOfFirst = segments[0].points[segments[0].points.length - 1];
    const startOfSecond = segments[1].points[0];
    expect(endOfFirst.quantity).toBeCloseTo(startOfSecond.quantity, 8);
    expect(startOfSecond.total).toBeLessThan(endOfFirst.total);
    expect(endOfFirst.total - startOfSecond.total).toBeGreaterThan(700);
  });
});

/* ================================================================== */
/* Reorder point across the three variability modes                   */
/* ================================================================== */

describe('demand during lead time', () => {
  it('scales demand variability by the square root of the lead time', () => {
    expect(sigmaDemandDuringLeadTime('demand', 50, 9, 8, 3)).toBeCloseTo(24, 10);
  });

  it('scales lead-time variability by average demand', () => {
    expect(sigmaDemandDuringLeadTime('lead-time', 50, 9, 8, 3)).toBeCloseTo(150, 10);
  });

  it('combines both sources in quadrature', () => {
    expect(sigmaDemandDuringLeadTime('both', 50, 9, 8, 3)).toBeCloseTo(
      Math.sqrt(9 * 64 + 2500 * 9),
      10,
    );
    expect(sigmaDemandDuringLeadTime('both', 50, 9, 8, 3)).toBeCloseTo(151.90787, 4);
  });

  it('reduces to the single-source cases when the other sigma is zero', () => {
    expect(sigmaDemandDuringLeadTime('both', 50, 9, 8, 0)).toBeCloseTo(24, 10);
    expect(sigmaDemandDuringLeadTime('both', 50, 9, 0, 3)).toBeCloseTo(150, 10);
  });
});

describe('reorder point', () => {
  it('is demand over the lead time plus safety stock', () => {
    const result = solveReorderPoint({
      mode: 'both',
      averageDemand: 50,
      leadTime: 9,
      demandStdDev: 8,
      leadTimeStdDev: 3,
      cycleServiceLevel: 0.95,
    });
    expect(result.demandDuringLeadTime).toBe(450);
    expect(result.safetyStock).toBeCloseTo(1.6448536 * 151.9078, 3);
    expect(result.reorderPoint).toBeCloseTo(450 + result.safetyStock, 10);
  });

  it('carries no safety stock at a 50% service level', () => {
    const result = solveReorderPoint({
      mode: 'demand',
      averageDemand: 50,
      leadTime: 9,
      demandStdDev: 8,
      leadTimeStdDev: 0,
      cycleServiceLevel: 0.5,
    });
    expect(result.safetyStock).toBeCloseTo(0, 9);
    expect(result.reorderPoint).toBeCloseTo(450, 9);
  });

  it('asks for more safety stock as the service level rises', () => {
    const levels = [0.8, 0.9, 0.95, 0.99];
    const stocks = levels.map(
      (level) =>
        solveReorderPoint({
          mode: 'demand',
          averageDemand: 50,
          leadTime: 9,
          demandStdDev: 8,
          leadTimeStdDev: 0,
          cycleServiceLevel: level,
        }).safetyStock,
    );
    for (let i = 1; i < stocks.length; i += 1) {
      expect(stocks[i]).toBeGreaterThan(stocks[i - 1]);
    }
  });
});

/* ================================================================== */
/* Sensitivity                                                        */
/* ================================================================== */

describe('cost penalty of ordering the wrong quantity', () => {
  it('matches 0.5 * (r + 1/r)', () => {
    expect(costPenaltyRatio(1)).toBeCloseTo(1, 12);
    expect(costPenaltyRatio(0.8)).toBeCloseTo(1.025, 12);
    expect(costPenaltyRatio(1.25)).toBeCloseTo(1.025, 12);
    expect(costPenaltyRatio(0.5)).toBeCloseTo(1.25, 12);
    expect(costPenaltyRatio(2)).toBeCloseTo(1.25, 12);
  });

  it('costs about 2.5% to order 20% below the optimum', () => {
    const rows = costPenaltyTable(10_000, 50, 2);
    const row = rows.find((candidate) => candidate.ratio === 0.8);
    expect(row?.quantity).toBeCloseTo(565.685, 3);
    expect(row?.relevantCost).toBeCloseTo(1449.569, 3);
    expect(row?.penaltyPercent).toBeCloseTo(2.5, 6);
  });

  it('costs nothing at the optimum, and flags that row', () => {
    const rows = costPenaltyTable(10_000, 50, 2);
    const row = rows.find((candidate) => candidate.isOptimum);
    expect(row?.penaltyPercent).toBeCloseTo(0, 12);
    expect(row?.relevantCost).toBeCloseTo(1414.2135624, 6);
  });

  it('agrees with a direct TRC evaluation at every ratio', () => {
    for (const row of costPenaltyTable(10_000, 50, 2)) {
      expect(row.relevantCost).toBeCloseTo(totalRelevantCost(10_000, 50, 2, row.quantity), 6);
    }
  });
});

describe('sensitivity to input error', () => {
  const rows = inputSensitivityTable(10_000, 50, 2);

  it('covers three parameters at five deviations each', () => {
    expect(rows).toHaveLength(15);
  });

  it('moves Q* by the square root of the error in D', () => {
    const row = rows.find((r) => r.parameter === 'annualDemand' && r.deviation === 0.2);
    expect(row?.parameterValue).toBeCloseTo(12_000, 8);
    expect(row?.quantityChangePercent).toBeCloseTo((Math.sqrt(1.2) - 1) * 100, 8);
    expect(row?.quantityChangePercent).toBeCloseTo(9.5445, 3);
  });

  it('moves Q* inversely with the square root of the error in H', () => {
    const row = rows.find((r) => r.parameter === 'holdingCostPerUnit' && r.deviation === 0.2);
    expect(row?.quantityChangePercent).toBeCloseTo((1 / Math.sqrt(1.2) - 1) * 100, 8);
    expect(row?.quantityChangePercent).toBeCloseTo(-8.7129, 3);
    expect(row?.relevantCostChangePercent).toBeCloseTo(9.5445, 3);
  });

  it('leaves the baseline row unchanged', () => {
    for (const row of rows.filter((r) => r.isBaseline)) {
      expect(row.quantityChangePercent).toBeCloseTo(0, 10);
      expect(row.relevantCostChangePercent).toBeCloseTo(0, 10);
      expect(row.quantity).toBeCloseTo(707.1067812, 6);
    }
  });

  it('dampens error: a 20% input error moves Q* by under 10%', () => {
    for (const row of rows) {
      if (row.deviation === 0) continue;
      expect(Math.abs(row.quantityChangePercent)).toBeLessThan(Math.abs(row.deviation * 100));
    }
  });

  it('reports TRC from the closed form at every varied point', () => {
    for (const row of rows) {
      const expected =
        row.parameter === 'annualDemand'
          ? totalRelevantCostAtOptimum(row.parameterValue, 50, 2)
          : row.parameter === 'orderCost'
            ? totalRelevantCostAtOptimum(10_000, row.parameterValue, 2)
            : totalRelevantCostAtOptimum(10_000, 50, row.parameterValue);
      expect(row.relevantCost).toBeCloseTo(expected, 8);
    }
  });
});
