'use client';

import type { DiscountAnalysis, DiscountTier, HoldingBasis } from '@/lib/eoq';
import { currencySymbol, formatQuantity, EMPTY_VALUE } from '@/lib/format';
import { Figure } from './Figure';
import { useSettings } from './Settings';

export interface DiscountTableProps {
  analysis: DiscountAnalysis | null;
  basis: HoldingBasis | null;
  /** True when a case pack multiple is set, which this comparison ignores. */
  hasRoundingMultiple: boolean;
}

/**
 * The all-units discount comparison.
 *
 * Every tier is evaluated and shown, not just the winner: seeing why a cheaper
 * unit price loses, or why a tier is infeasible because its own EOQ falls
 * outside the range where that price applies, is the part worth reading. The
 * recommendation is marked rather than being the only thing printed.
 */
export function DiscountTable({ analysis, basis, hasRoundingMultiple }: DiscountTableProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  const statusText = (status: DiscountTier['status']): string => {
    switch (status) {
      case 'eoq-in-range':
        return t.discounts.status.inRange;
      case 'raised-to-break':
        return t.discounts.status.raised;
      case 'infeasible':
        return t.discounts.status.infeasible;
    }
  };

  const range = (tier: DiscountTier): string =>
    tier.maxQty === null
      ? `${formatQuantity(tier.minQty, locale)}+`
      : `${formatQuantity(tier.minQty, locale)}–${formatQuantity(tier.maxQty, locale)}`;

  return (
    <section className="panel">
      <div className="px-4 pt-3">
        <h2 className="t-label">{t.sections.discounts}</h2>
        <p className="t-micro mt-1 max-w-[75ch] text-[color:var(--text-2)]">
          {t.discounts.model}
        </p>
        {basis?.kind === 'rate' ? (
          <p className="t-micro mt-0.5 max-w-[75ch] text-[color:var(--text-2)]">
            {t.discounts.holdingNote}
          </p>
        ) : null}
        {hasRoundingMultiple ? (
          <p className="t-micro mt-0.5 max-w-[75ch] text-[color:var(--text-2)]">
            {t.discounts.roundingNote}
          </p>
        ) : null}
      </div>

      {analysis === null ? (
        <p className="t-micro px-4 py-3 text-[color:var(--text-2)]">
          {t.empty.discountNeeds}
        </p>
      ) : analysis.best === null ? (
        <p className="t-micro px-4 py-3 text-[color:var(--signal)]">
          {t.discounts.noneFeasible}
        </p>
      ) : (
        <>
          <p className="t-body flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 pt-2">
            <span className="t-micro text-[color:var(--text-2)]">
              {t.discounts.withSchedule}
            </span>
            <span className="num text-[color:var(--accent)]">
              <Figure
                value={analysis.best.candidateQuantity}
                decimals={0}
                testId="discount-recommendation"
              />
            </span>
            <span className="unit">{t.units.units}</span>
            <span className="t-micro text-[color:var(--text-2)]">{t.discounts.at}</span>
            <span className="num">
              <Figure value={analysis.best.unitCost} decimals={2} />
            </span>
            <span className="unit">{symbol}</span>
          </p>

          <div className="table-scroll px-4 py-2">
            <table className="banded t-body" data-testid="discount-table">
              <caption className="sr-only">{t.sections.discounts}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.discounts.columns.tier}</th>
                  <th scope="col">{t.discounts.columns.range}</th>
                  <th scope="col" className="n">
                    {t.discounts.columns.unitCost}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.tierEoq}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.candidate}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.purchase}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.ordering}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.holding}
                  </th>
                  <th scope="col" className="n">
                    {t.discounts.columns.total}
                  </th>
                  <th scope="col">{t.discounts.columns.status}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.tiers.map((tier) => {
                  const best = tier.index === analysis.bestIndex;
                  return (
                    <tr
                      key={tier.index}
                      data-best={best ? 'true' : 'false'}
                      data-feasible={tier.status === 'infeasible' ? 'false' : 'true'}
                      data-testid={best ? 'discount-winner' : 'discount-row'}
                    >
                      <th scope="row">
                        {tier.index + 1}
                        {best ? <span className="sr-only"> {t.discounts.recommended}</span> : null}
                      </th>
                      <td>{range(tier)}</td>
                      <td className="n">
                        <Figure value={tier.unitCost} decimals={2} />
                      </td>
                      <td className="n">
                        <Figure value={tier.tierEoq} decimals={1} />
                      </td>
                      <td className="n">
                        {tier.candidateQuantity === null ? (
                          EMPTY_VALUE
                        ) : (
                          <Figure value={tier.candidateQuantity} decimals={1} />
                        )}
                      </td>
                      <td className="n">
                        <Figure value={tier.purchaseCost} decimals={2} />
                      </td>
                      <td className="n">
                        <Figure value={tier.orderingCost} decimals={2} />
                      </td>
                      <td className="n">
                        <Figure value={tier.holdingCost} decimals={2} />
                      </td>
                      <td className={`n ${best ? 'text-[color:var(--accent)]' : ''}`}>
                        <Figure value={tier.totalCost} decimals={2} />
                      </td>
                      <td className="t-micro text-[color:var(--text-2)]">
                        {statusText(tier.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
