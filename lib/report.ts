/**
 * What the tool has to say, as data rather than as markup.
 *
 * Both exports read from here: the CSV writes these sections as rows, and the
 * print sheet renders the assumptions in its footer. Keeping one source means
 * a printed sheet and a downloaded file can never disagree about what was
 * entered.
 */

import type { Derived } from './derive';
import type { CsvSection } from './csv';
import {
  formatForCsv,
  type CurrencyCode,
  type Locale,
} from './format';
import type { Dictionary } from './i18n';
import type { ToolState } from './state';

export interface ReportInput {
  state: ToolState;
  derived: Derived;
  t: Dictionary;
  locale: Locale;
  currency: CurrencyCode;
}

export interface Assumption {
  label: string;
  value: string;
  unit: string;
}

/**
 * Every input that carries a value, with its unit. This is what a reader needs
 * to judge whether the answer applies to them.
 */
export function assumptions({ state, derived, t, locale, currency }: ReportInput): Assumption[] {
  const { values } = derived;
  const money = currency;
  const perPeriod = state.periodUnit === 'week' ? t.units.unitsPerWeek : t.units.unitsPerDay;
  const periods = state.periodUnit === 'week' ? t.units.weeks : t.units.days;

  const rows: Assumption[] = [];
  const add = (
    label: string,
    value: number | undefined,
    unit: string,
    decimals = 2,
  ): void => {
    if (value === undefined) return;
    rows.push({ label, value: formatForCsv(value, locale, decimals), unit });
  };

  add(t.fields.annualDemand.label, values.annualDemand, t.units.unitsPerYear, 0);
  add(t.fields.orderCost.label, values.orderCost, `${money} ${t.units.perOrder}`);

  if (state.holdingMode === 'rate') {
    add(t.fields.holdingRate.label, values.holdingRate, t.units.percentOfUnitCost, 4);
    add(t.fields.unitCost.label, values.unitCost, `${money} ${t.units.perUnit}`);
    if (derived.holdingCostPerUnit !== null) {
      rows.push({
        label: t.holdingMode.derived,
        value: formatForCsv(derived.holdingCostPerUnit, locale, 4),
        unit: `${money} ${t.units.perUnitYear}`,
      });
    }
  } else {
    add(t.fields.holdingCostPerUnit.label, values.holdingCostPerUnit, `${money} ${t.units.perUnitYear}`);
    add(t.fields.unitCost.label, values.unitCost, `${money} ${t.units.perUnit}`);
  }

  add(t.fields.daysPerYear.label, values.daysPerYear, t.units.days, 0);
  add(t.fields.roundingMultiple.label, values.roundingMultiple, t.units.units, 0);

  if (state.reorderEnabled) {
    const mode =
      state.variabilityMode === 'demand'
        ? t.variability.demand
        : state.variabilityMode === 'lead-time'
          ? t.variability.leadTime
          : t.variability.both;
    rows.push({ label: t.variability.legend, value: mode, unit: '' });
    add(t.fields.averageDemand.label, values.averageDemand, perPeriod);
    add(t.fields.leadTime.label, values.leadTime, periods);
    add(t.fields.demandStdDev.label, values.demandStdDev, perPeriod);
    add(t.fields.leadTimeStdDev.label, values.leadTimeStdDev, periods);
    add(t.fields.cycleServiceLevel.label, values.cycleServiceLevel, '', 4);
  }

  return rows;
}

/** The sections a CSV export is made of, in the order they are written. */
export function reportSections(input: ReportInput): CsvSection[] {
  const { derived, t, locale, currency } = input;
  const sections: CsvSection[] = [];
  const money = (value: number | null): string =>
    value === null ? '' : formatForCsv(value, locale, 2);
  const qty = (value: number | null, decimals = 1): string =>
    value === null ? '' : formatForCsv(value, locale, decimals);

  sections.push({
    title: t.csv.inputs,
    header: [t.csv.field, t.csv.value, t.csv.unit],
    rows: assumptions(input).map((row) => [row.label, row.value, row.unit]),
  });

  if (derived.eoq !== null) {
    const eoq = derived.eoq;
    const rows: string[][] = [
      [t.results.quantity, qty(eoq.quantity), t.units.units],
      [t.results.ordersPerYear, formatForCsv(eoq.ordersPerYear, locale, 2), t.units.perYear],
      [t.results.daysBetween, formatForCsv(eoq.daysBetweenOrders, locale, 1), t.units.days],
      [t.results.orderingCost, money(eoq.orderingCost), currency],
      [t.results.cycleHoldingCost, money(eoq.cycleHoldingCost), currency],
      [t.results.safetyStockHoldingCost, money(eoq.safetyStockHoldingCost), currency],
      [t.results.relevantCost, money(eoq.relevantCost), currency],
      [t.results.averageInventory, qty(eoq.averageInventory), t.units.units],
    ];
    if (eoq.purchaseCost !== null) rows.push([t.results.purchaseCost, money(eoq.purchaseCost), currency]);
    if (eoq.totalCost !== null) rows.push([t.results.totalCost, money(eoq.totalCost), currency]);

    if (derived.practical !== null) {
      rows.push([t.results.practicalQuantity, qty(derived.practical.quantity, 0), t.units.units]);
      rows.push([t.results.penalty, money(derived.practical.penalty), currency]);
    }

    if (derived.reorder !== null) {
      rows.push([t.results.sigmaDdlt, formatForCsv(derived.reorder.sigmaDdlt, locale, 2), '']);
      rows.push([t.results.safetyFactor, formatForCsv(derived.reorder.z, locale, 4), '']);
      rows.push([t.results.safetyStock, qty(derived.reorder.safetyStock, 2), t.units.units]);
      rows.push([t.results.reorderPoint, qty(derived.reorder.reorderPoint, 2), t.units.units]);
    }

    sections.push({ title: t.csv.results, header: [t.csv.field, t.csv.value, t.csv.unit], rows });
  }

  if (derived.discounts !== null) {
    sections.push({
      title: t.sections.discounts,
      header: [
        t.discounts.columns.tier,
        t.discounts.columns.range,
        t.discounts.columns.unitCost,
        t.discounts.columns.tierEoq,
        t.discounts.columns.candidate,
        t.discounts.columns.purchase,
        t.discounts.columns.ordering,
        t.discounts.columns.holding,
        t.discounts.columns.total,
        t.discounts.columns.status,
      ],
      rows: derived.discounts.tiers.map((tier) => [
        `${tier.index + 1}${tier.index === derived.discounts?.bestIndex ? ` (${t.discounts.recommended})` : ''}`,
        tier.maxQty === null
          ? `${formatForCsv(tier.minQty, locale, 0)}+`
          : `${formatForCsv(tier.minQty, locale, 0)}-${formatForCsv(tier.maxQty, locale, 0)}`,
        money(tier.unitCost),
        qty(tier.tierEoq),
        qty(tier.candidateQuantity),
        money(tier.purchaseCost),
        money(tier.orderingCost),
        money(tier.holdingCost),
        money(tier.totalCost),
        tier.status === 'eoq-in-range'
          ? t.discounts.status.inRange
          : tier.status === 'raised-to-break'
            ? t.discounts.status.raised
            : t.discounts.status.infeasible,
      ]),
    });
  }

  if (derived.penaltyRows.length > 0) {
    sections.push({
      title: t.sections.penalty,
      header: [
        t.penalty.columns.ratio,
        t.penalty.columns.quantity,
        t.penalty.columns.relevantCost,
        t.penalty.columns.penalty,
      ],
      rows: derived.penaltyRows.map((row) => [
        formatForCsv(row.ratio, locale, 2),
        qty(row.quantity, 0),
        money(row.relevantCost),
        formatForCsv(row.penaltyPercent, locale, 2),
      ]),
    });
  }

  if (derived.sensitivityRows.length > 0) {
    sections.push({
      title: t.sections.sensitivity,
      header: [
        t.sensitivity.columns.parameter,
        t.sensitivity.columns.deviation,
        t.sensitivity.columns.value,
        t.sensitivity.columns.quantity,
        t.sensitivity.columns.quantityChange,
        t.sensitivity.columns.relevantCost,
        t.sensitivity.columns.relevantCostChange,
      ],
      rows: derived.sensitivityRows.map((row) => [
        t.sensitivity.parameters[row.parameter],
        row.isBaseline ? t.sensitivity.baseline : formatForCsv(row.deviation * 100, locale, 0),
        formatForCsv(row.parameterValue, locale, 2),
        qty(row.quantity),
        formatForCsv(row.quantityChangePercent, locale, 1),
        money(row.relevantCost),
        formatForCsv(row.relevantCostChangePercent, locale, 1),
      ]),
    });
  }

  return sections;
}
