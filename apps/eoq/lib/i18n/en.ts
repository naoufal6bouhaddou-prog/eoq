/**
 * English dictionary. This object defines the shape every other language has
 * to match: `Dictionary` is `typeof en`, so a missing or misspelled key in
 * fr.ts is a type error rather than a blank space in the interface.
 */
export const en = {
  meta: {
    title: 'Inventory ordering calculator',
    description:
      'Economic order quantity, reorder point and all-units quantity discounts, calculated in the browser.',
  },

  app: {
    name: 'Inventory ordering calculator',
    tool: 'Inventory ordering',
    language: 'Language',
    currency: 'Currency',
    siblings: 'Tools',
  },

  actions: {
    loadExample: 'Load example',
    clear: 'Clear all fields',
    addTier: 'Add tier',
    removeTier: 'Remove tier',
  },

  sections: {
    demandAndCost: 'Demand and cost',
    workingYear: 'Working year',
    casePack: 'Case pack',
    reorder: 'Reorder point',
    breaks: 'Price breaks',
    results: 'Results',
    chart: 'Cost curve',
    discounts: 'All-units discount comparison',
    penalty: 'Cost of ordering the wrong quantity',
  },

  fields: {
    annualDemand: { symbol: 'D', label: 'Annual demand' },
    orderCost: { symbol: 'S', label: 'Cost per order' },
    holdingCostPerUnit: { symbol: 'H', label: 'Holding cost per unit' },
    holdingRate: { symbol: 'i', label: 'Holding rate' },
    unitCost: { symbol: 'C', label: 'Unit purchase cost' },
    daysPerYear: { symbol: '', label: 'Working days per year' },
    roundingMultiple: { symbol: '', label: 'Order in multiples of' },
    averageDemand: { symbol: 'd̄', label: 'Average demand per period' },
    leadTime: { symbol: 'L', label: 'Lead time' },
    demandStdDev: { symbol: 'σd', label: 'Std dev of demand per period' },
    leadTimeStdDev: { symbol: 'σL', label: 'Std dev of lead time' },
    cycleServiceLevel: { symbol: 'CSL', label: 'Cycle service level' },
  },

  holdingMode: {
    legend: 'Holding cost given as',
    perUnit: 'Amount per unit',
    rate: 'Rate on unit cost',
    derived: 'H = i × C',
  },

  variability: {
    legend: 'What varies',
    demand: 'Demand varies, lead time fixed',
    leadTime: 'Lead time varies, demand fixed',
    both: 'Both vary',
  },

  period: {
    legend: 'Period',
    day: 'Day',
    week: 'Week',
    days: 'days',
    weeks: 'weeks',
  },

  toggles: {
    reorderOn: 'Calculate a reorder point',
    discountsOn: 'Apply a discount schedule',
  },

  results: {
    quantity: 'Economic order quantity',
    quantityShort: 'Q*',
    ordersPerYear: 'Orders per year',
    daysBetween: 'Days between orders',
    orderingCost: 'Ordering cost',
    holdingCost: 'Holding cost',
    cycleHoldingCost: 'Cycle holding cost',
    safetyStockHoldingCost: 'Safety stock holding cost',
    relevantCost: 'Total relevant cost',
    relevantCostShort: 'TRC',
    purchaseCost: 'Purchase cost',
    totalCost: 'Total annual cost',
    averageInventory: 'Average inventory',
    safetyStock: 'Safety stock',
    reorderPoint: 'Reorder point',
    safetyFactor: 'Safety factor',
    sigmaDdlt: 'Std dev over lead time',
    demandDuringLeadTime: 'Demand during lead time',
    practicalQuantity: 'Rounded order quantity',
    penalty: 'Cost of rounding',
    balanced: 'At Q*, ordering cost equals holding cost',
    notBalanced: 'Ordering and holding cost differ, so this is not Q*',
    closedForm: 'TRC = √(2·D·S·H)',
    orderWhole: 'Order in whole units: round up to',
    beforeRounding: 'before rounding',
    serviceLevelNote:
      'The probability of not stocking out during a replenishment cycle. This is not fill rate.',
  },

  units: {
    units: 'units',
    unitsPerYear: 'units/year',
    unitsPerDay: 'units/day',
    unitsPerWeek: 'units/week',
    ordersPerYear: 'orders/year',
    days: 'days',
    weeks: 'weeks',
    perOrder: 'per order',
    perUnitYear: 'per unit/year',
    perUnit: 'per unit',
    perYear: 'per year',
    percent: '%',
    percentOfUnitCost: '% of unit cost',
  },

  discounts: {
    model:
      'All-units model: reaching a break re-prices the whole order. Incremental schedules behave differently and are not calculated here.',
    holdingNote: 'Holding cost follows the tier price, so each tier has its own H.',
    roundingNote:
      'The case pack multiple applies to the classic result above, not to this comparison.',
    columns: {
      tier: 'Tier',
      range: 'Quantity range',
      unitCost: 'Unit cost',
      tierEoq: 'Tier EOQ',
      candidate: 'Order quantity',
      purchase: 'Purchase',
      ordering: 'Ordering',
      holding: 'Holding',
      total: 'Total annual cost',
      status: 'Why',
    },
    status: {
      inRange: 'EOQ falls in range',
      raised: 'Raised to the break',
      infeasible: 'EOQ above this range',
    },
    recommended: 'Lowest total cost',
    withSchedule: 'With this schedule, order',
    minQty: 'Quantity from',
    at: 'at',
    noneFeasible: 'No tier has a feasible order quantity.',
  },

  penalty: {
    caption:
      'The cost curve is flat near its minimum. Ordering 20% away from Q* costs about 2% more.',
    columns: {
      ratio: 'Q / Q*',
      quantity: 'Q',
      relevantCost: 'TRC',
      penalty: 'Penalty',
    },
    optimum: 'Optimum',
  },


  profile: {
    title: 'Inventory over time',
    caption:
      'Stock falls at the demand rate, reaches the reorder point, and the order placed there arrives exactly as the safety stock is reached.',
    captionPlain:
      'Stock falls at the demand rate and is replenished by Q each time it runs out.',
    orderPlaced: 'order placed',
    delivery: 'delivery',
    leadTimeSpan: 'lead time',
    cycle: 'Cycle',
    axisTime: 'Time',
    axisLevel: 'Stock on hand',
    tableCaption: 'Inventory level at each event',
    tableEvent: 'Event',
    tableTime: 'Time',
    tableLevel: 'Stock on hand',
    eventStart: 'Cycle starts, stock replenished',
    eventOrder: 'Stock reaches the reorder point, order placed',
    eventDelivery: 'Delivery arrives',
  },

  chart: {
    title: 'Annual cost against order quantity',
    xAxis: 'Order quantity',
    yAxis: 'Annual cost',
    ordering: 'ordering',
    holding: 'holding',
    total: 'total',
    optimum: 'Q*',
    readoutHint: 'Move across the chart, or use the arrow keys, to read cost at any quantity.',
    readoutQuantity: 'At Q',
    readoutCost: 'Cost',
    readoutPenalty: 'Versus optimum',
    priceBreak: 'Price break',
    includesPurchase: 'Total includes purchase cost, so the curve drops at each break.',
    tableCaption: 'Cost curve values',
    tableQuantity: 'Order quantity',
    tableOrdering: 'Ordering cost',
    tableHolding: 'Holding cost',
    tableTotal: 'Total cost',
  },

  errors: {
    required: 'Enter a value',
    'not-a-number': 'Not a number. Use digits, with a comma or a point for decimals.',
    'must-be-positive': 'Must be greater than 0',
    'must-be-non-negative': 'Must be 0 or more',
    'rate-out-of-range': 'Must be greater than 0 and at most 100',
    'service-level-out-of-range':
      'Must be between 0 and 100, exclusive. A 100% service level needs infinite safety stock.',
  },

  schedule: {
    'schedule-empty': 'Add at least one tier, starting at quantity 1',
    'first-tier-must-start-at-one': 'The first tier must start at quantity 1',
    'min-qty-must-be-whole-and-positive': 'Quantity must be a whole number of 1 or more',
    'min-qty-must-ascend': 'Each tier must start above the one before it',
    'unit-cost-must-be-positive': 'Unit cost must be greater than 0',
  },

  empty: {
    headline: 'Nothing to calculate yet',
    needs: 'Still needed:',
    reorderNeeds: 'The reorder point needs average demand, lead time and a service level.',
    discountNeeds: 'The comparison needs a valid price break schedule.',
  },



  a11y: {
    skipToResults: 'Skip to results',
    inputRail: 'Inputs',
    resultsRegion: 'Results',
    chartRegion: 'Cost curve',
    removeTierAt: 'Remove the tier starting at',
  },
};

export type Dictionary = typeof en;
