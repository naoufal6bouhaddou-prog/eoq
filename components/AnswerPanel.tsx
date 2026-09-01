'use client';

import type { EoqResult, PracticalQuantity } from '@/lib/eoq';
import { currencySymbol } from '@/lib/format';

import { Figure, Measure } from './Figure';
import { useSettings } from './Settings';

export interface AnswerPanelProps {
  eoq: EoqResult | null;
  practical: PracticalQuantity | null;
  missingLabels: string[];
}

/** The id the pinned summary watches to know whether the answer is on screen. */
export const ANSWER_PANEL_ID = 'answer-panel';

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="t-micro text-[color:var(--text-2)]">{label}</dt>
      <dd className="t-figure-lg num mt-0.5">{children}</dd>
    </div>
  );
}

/**
 * The answer, and the figures that support it.
 *
 * Q* is why someone opened the page, so it is set at display size and given the
 * panel to itself. Orders a year, the cycle in days and the annual cost are
 * supporting detail: they sit beneath a rule at a smaller size, not beside it as
 * equals. Four figures of the same size in four equal cells is a dashboard
 * pattern, and a dashboard is what you read when you do not have a question.
 *
 * Under them, the identity that proves the quantity is the optimum: at Q* the
 * ordering cost equals the holding cost. That line is a check the reader can do
 * by eye, not an ornament.
 */
export function AnswerPanel({ eoq, practical, missingLabels }: AnswerPanelProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  if (eoq === null) {
    return (
      <section id={ANSWER_PANEL_ID} className="panel" aria-label={t.a11y.resultsRegion}>
        <div className="panel-body">
          <p className="t-body" data-testid="empty-state">
            {t.empty.headline}
          </p>
          {missingLabels.length > 0 ? (
            <p className="t-micro mt-1.5 text-[color:var(--text-2)]">
              {t.empty.needs} {missingLabels.join(', ')}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section id={ANSWER_PANEL_ID} className="panel" aria-label={t.a11y.resultsRegion}>
      <div className="panel-head">
        <h2 className="t-label">{t.results.quantity}</h2>
        <p className="t-micro flex flex-wrap items-baseline gap-x-1.5 text-[color:var(--text-2)]">
          <span>{t.results.orderingCost}</span>
          <Figure
            value={eoq.orderingCost}
            decimals={2}
            className="text-[color:var(--text)]"
            testId="result-ordering"
          />
          <span aria-hidden="true">{eoq.costsBalanced ? '=' : '≠'}</span>
          <span>{t.results.cycleHoldingCost}</span>
          <Figure
            value={eoq.cycleHoldingCost}
            decimals={2}
            className="text-[color:var(--text)]"
            testId="result-holding"
          />
        </p>
      </div>

      <div className="panel-body">
        <p className="t-display num">
          <Measure
            value={eoq.quantity}
            decimals={1}
            unit={t.units.units}
            width={6}
            testId="result-quantity"
          />
        </p>
        <p className="t-micro mt-1 text-[color:var(--text-2)]">
          {eoq.costsBalanced ? t.results.balanced : t.results.notBalanced}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[color:var(--line)] pt-3 sm:grid-cols-3">
          <Stat label={t.results.ordersPerYear}>
            <Measure
              value={eoq.ordersPerYear}
              decimals={2}
              unit={t.units.perYear}
              width={5}
              testId="result-orders"
            />
          </Stat>
          <Stat label={t.results.daysBetween}>
            <Measure
              value={eoq.daysBetweenOrders}
              decimals={1}
              unit={t.units.days}
              width={4}
              testId="result-days"
            />
          </Stat>
          <Stat label={t.results.relevantCost}>
            <Measure
              value={eoq.relevantCost}
              decimals={2}
              unit={symbol}
              width={8}
              testId="result-trc"
            />
          </Stat>
        </dl>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-[color:var(--line)] pt-2.5">
          <div className="flex items-baseline gap-1.5">
            <dt className="t-micro text-[color:var(--text-2)]">{t.results.averageInventory}</dt>
            <dd className="t-body num">
              <Figure value={eoq.averageInventory} decimals={1} />
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="t-micro text-[color:var(--text-2)]">{t.results.closedForm}</dt>
            <dd className="t-body num">
              <Figure value={eoq.relevantCostClosedForm} decimals={2} />
            </dd>
          </div>
          {eoq.purchaseCost === null ? null : (
            <div className="flex items-baseline gap-1.5">
              <dt className="t-micro text-[color:var(--text-2)]">{t.results.purchaseCost}</dt>
              <dd className="t-body num">
                <Figure value={eoq.purchaseCost} decimals={2} />
              </dd>
            </div>
          )}
          {eoq.totalCost === null ? null : (
            <div className="flex items-baseline gap-1.5">
              <dt className="t-micro text-[color:var(--text-2)]">{t.results.totalCost}</dt>
              <dd className="t-body num">
                <Figure value={eoq.totalCost} decimals={2} />
              </dd>
            </div>
          )}
        </dl>

        {practical === null ? null : (
          <p className="t-micro mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-[color:var(--line)] pt-2.5 text-[color:var(--text-2)]">
            <span className="flex items-baseline gap-1.5">
              {t.results.practicalQuantity}
              <Figure
                value={practical.quantity}
                decimals={0}
                className="text-[color:var(--text)]"
                testId="result-practical"
              />
              <span className="unit">{t.units.units}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              {t.results.penalty}
              <Figure value={practical.penalty} decimals={2} className="text-[color:var(--text)]" />
              <span className="unit">{symbol}</span>
              <Figure
                value={practical.penaltyPercent}
                decimals={2}
                className="text-[color:var(--text)]"
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
