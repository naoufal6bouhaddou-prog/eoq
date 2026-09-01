'use client';

import type { EoqResult, PracticalQuantity } from '@/lib/eoq';
import { currencySymbol } from '@/lib/format';

import { Figure, Measure } from './Figure';
import { useSettings } from './Settings';

export interface ResultsBandProps {
  eoq: EoqResult | null;
  practical: PracticalQuantity | null;
  missingLabels: string[];
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 px-3 py-2 lg:px-4 lg:py-3">
      <p className="t-label mb-1.5 text-[color:var(--c-ink-muted)]">{label}</p>
      <p className="t-figure-lg num">{children}</p>
    </div>
  );
}

/**
 * The four figures a buyer came for, in one ruled band divided by hairlines.
 *
 * The two answers, Q* and the cost of running at it, sit together and pin to
 * the top of a phone viewport while the inputs below are edited. The cadence
 * pair, orders a year and days between them, follows and scrolls away. On a
 * wide screen the split disappears and all four sit in one row.
 *
 * Under them, the identity that proves the quantity is the optimum: at Q* the
 * ordering cost and the holding cost are equal. That line is a check the
 * reader can do by eye, not an ornament.
 */
export function ResultsBand({ eoq, practical, missingLabels }: ResultsBandProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  if (eoq === null) {
    return (
      <section
        aria-label={t.a11y.resultsRegion}
        className="border-b border-[color:var(--c-rule)] px-4 py-6"
      >
        <p className="t-body" data-testid="empty-state">
          {t.empty.headline}
        </p>
        {missingLabels.length > 0 ? (
          <p className="t-micro mt-1.5 text-[color:var(--c-ink-muted)]">
            {t.empty.needs} {missingLabels.join(', ')}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-label={t.a11y.resultsRegion}
      className="border-b border-[color:var(--c-rule)] bg-[color:var(--c-paper)]"
    >
      <div className="results-grid xl:grid xl:grid-cols-4">
        {/* Below the wide breakpoint these two are carried by StickySummary,
            which pins them to the top of the viewport. Hidden rather than
            duplicated, so only one copy is ever in the accessibility tree. */}
        <div className="results-pair hidden xl:contents">
          <div className="min-w-0 border-r border-[color:var(--c-rule)]">
            <Cell label={t.results.quantity}>
              <Measure
                value={eoq.quantity}
                decimals={1}
                unit={t.units.units}
                width={6}
                testId="result-quantity"
              />
            </Cell>
          </div>
          <div className="min-w-0 border-r border-[color:var(--c-rule)]">
            <Cell label={t.results.relevantCost}>
              <Measure
                value={eoq.relevantCost}
                decimals={2}
                unit={symbol}
                width={8}
                testId="result-trc"
              />
            </Cell>
          </div>
        </div>

        <div className="cadence-pair grid grid-cols-2 xl:contents">
          <div className="min-w-0 xl:border-r xl:border-[color:var(--c-rule)]">
            <Cell label={t.results.ordersPerYear}>
              <Measure
                value={eoq.ordersPerYear}
                decimals={2}
                unit={t.units.perYear}
                width={5}
                testId="result-orders"
              />
            </Cell>
          </div>
          <div className="min-w-0 border-l border-[color:var(--c-rule)] xl:border-l-0">
            <Cell label={t.results.daysBetween}>
              <Measure
                value={eoq.daysBetweenOrders}
                decimals={1}
                unit={t.units.days}
                width={4}
                testId="result-days"
              />
            </Cell>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[color:var(--c-rule)] px-3 py-1.5 lg:px-4 lg:py-2">
        <p className="t-micro flex items-baseline gap-1.5 text-[color:var(--c-ink-muted)]">
          <span>{t.results.orderingCost}</span>
          <Figure
            value={eoq.orderingCost}
            decimals={2}
            className="text-[color:var(--c-ink)]"
            testId="result-ordering"
          />
          <span aria-hidden="true">{eoq.costsBalanced ? '=' : '≠'}</span>
          <span>{t.results.cycleHoldingCost}</span>
          <Figure
            value={eoq.cycleHoldingCost}
            decimals={2}
            className="text-[color:var(--c-ink)]"
            testId="result-holding"
          />
        </p>
        <p className="t-micro text-[color:var(--c-ink-muted)]">
          {eoq.costsBalanced ? t.results.balanced : t.results.notBalanced}
        </p>

        {practical === null ? null : (
          <p className="t-micro flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[color:var(--c-ink-muted)]">
            <span className="flex items-baseline gap-1.5">
              {t.results.practicalQuantity}
              <Figure
                value={practical.quantity}
                decimals={0}
                className="text-[color:var(--c-ink)]"
                testId="result-practical"
              />
              <span className="unit">{t.units.units}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              {t.results.penalty}
              <Figure value={practical.penalty} decimals={2} className="text-[color:var(--c-ink)]" />
              <span className="unit">{symbol}</span>
              <Figure
                value={practical.penaltyPercent}
                decimals={2}
                className="text-[color:var(--c-ink)]"
                testId="result-penalty-percent"
              />
              <span className="unit">%</span>
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
