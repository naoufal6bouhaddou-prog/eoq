'use client';

import type { EoqResult, ReorderResult } from '@/lib/eoq';
import { currencySymbol } from '@/lib/format';
import { Figure, Measure } from './Figure';
import { useSettings } from './Settings';

export interface ReorderPanelProps {
  reorder: ReorderResult | null;
  eoq: EoqResult | null;
  /** Which fields the reorder point is still waiting on. */
  missingLabels: string[];
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="t-micro flex items-baseline gap-1.5 text-[color:var(--c-ink-muted)]">
      {label}
      {children}
    </span>
  );
}

/**
 * Reorder point and safety stock.
 *
 * The reorder point is the second of the two figures a buyer acts on, so it is
 * the second and last place red appears. Both it and the safety stock are also
 * given rounded up to whole units, because stock is counted in whole units and
 * rounding down would quietly undershoot the service level that was asked for.
 */
export function ReorderPanel({ reorder, eoq, missingLabels }: ReorderPanelProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  if (reorder === null) {
    return (
      <section className="border-b border-[color:var(--c-rule)] px-4 py-3">
        <h2 className="t-label mb-1">{t.sections.reorder}</h2>
        <p className="t-micro text-[color:var(--c-ink-muted)]">
          {missingLabels.length > 0
            ? `${t.empty.needs} ${missingLabels.join(', ')}`
            : t.empty.reorderNeeds}
        </p>
      </section>
    );
  }

  return (
    <section className="border-b border-[color:var(--c-rule)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-3">
        <h2 className="t-label">{t.sections.reorder}</h2>
        <p className="t-micro text-[color:var(--c-ink-muted)]">{t.results.serviceLevelNote}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 px-4 py-2 sm:grid-cols-4">
        <div className="min-w-0">
          <p className="t-label mb-1 text-[color:var(--c-ink-muted)]">{t.results.reorderPoint}</p>
          <p className="t-figure-lg num text-[color:var(--c-signal)]">
            <Measure
              value={Math.ceil(reorder.reorderPoint)}
              decimals={0}
              unit={t.units.units}
              width={6}
              testId="reorder-point"
            />
          </p>
        </div>

        <div className="min-w-0">
          <p className="t-label mb-1 text-[color:var(--c-ink-muted)]">{t.results.safetyStock}</p>
          <p className="t-figure-lg num">
            <Measure
              value={Math.ceil(reorder.safetyStock)}
              decimals={0}
              unit={t.units.units}
              width={5}
              testId="safety-stock"
            />
          </p>
        </div>

        <div className="col-span-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 self-end pb-1">
          <Line label={t.results.demandDuringLeadTime}>
            <Figure
              value={reorder.demandDuringLeadTime}
              decimals={1}
              className="text-[color:var(--c-ink)]"
            />
            <span className="unit">{t.units.units}</span>
          </Line>
          <Line label={t.results.sigmaDdlt}>
            <Figure
              value={reorder.sigmaDdlt}
              decimals={2}
              className="text-[color:var(--c-ink)]"
              testId="sigma-ddlt"
            />
          </Line>
          <Line label={t.results.safetyFactor}>
            <Figure
              value={reorder.z}
              decimals={4}
              className="text-[color:var(--c-ink)]"
              testId="safety-factor"
            />
          </Line>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[color:var(--c-rule)] px-4 py-1.5">
        <Line label={`${t.results.reorderPoint} (${t.results.beforeRounding})`}>
          <Figure
            value={reorder.reorderPoint}
            decimals={2}
            className="text-[color:var(--c-ink)]"
            testId="reorder-point-exact"
          />
        </Line>
        <Line label={`${t.results.safetyStock} (${t.results.beforeRounding})`}>
          <Figure
            value={reorder.safetyStock}
            decimals={2}
            className="text-[color:var(--c-ink)]"
            testId="safety-stock-exact"
          />
        </Line>
        {eoq === null ? null : (
          <Line label={t.results.safetyStockHoldingCost}>
            <Figure
              value={eoq.safetyStockHoldingCost}
              decimals={2}
              className="text-[color:var(--c-ink)]"
              testId="safety-stock-cost"
            />
            <span className="unit">{symbol}</span>
          </Line>
        )}
      </div>
    </section>
  );
}
