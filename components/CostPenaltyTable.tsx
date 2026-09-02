'use client';

import type { CostPenaltyRow } from '@/lib/eoq';
import { currencySymbol } from '@/shared/lib/format';

import { Figure } from '@/shared/ui/Figure';
import { useSettings } from './Settings';

export interface CostPenaltyTableProps {
  penaltyRows: CostPenaltyRow[];
}

/**
 * How much ordering away from Q* actually costs.
 *
 * This is the most useful output on the page for a practitioner: the EOQ cost
 * curve is flat near its minimum, so ordering a fifth away from Q* costs about
 * two and a half percent. A buyer who cannot order 707 can stop worrying.
 *
 * Percentages are given to one decimal throughout the tool, except for the
 * penalty against the optimum, which gets two: how small that number is
 * happens to be the entire point of it.
 */
export function CostPenaltyTable({ penaltyRows }: CostPenaltyTableProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  return (
    <section className="panel">
      <div className="px-4 pt-3">
        <h2 className="t-label">{t.sections.penalty}</h2>
        <p className="note t-micro mt-1 text-[color:var(--text-2)]">{t.penalty.caption}</p>
      </div>

      <div className="table-scroll px-4 py-2">
        <table className="banded t-body" data-testid="penalty-table">
          <caption className="sr-only">{t.sections.penalty}</caption>
          <thead>
            <tr>
              <th scope="col" className="n">
                {t.penalty.columns.ratio}
              </th>
              <th scope="col" className="n">
                {t.penalty.columns.quantity}
              </th>
              <th scope="col" className="n">
                {t.penalty.columns.relevantCost} <span className="unit">{symbol}</span>
              </th>
              <th scope="col" className="n">
                {t.penalty.columns.penalty} <span className="unit">%</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {penaltyRows.map((row) => (
              <tr
                key={row.ratio}
                data-ratio={row.ratio}
                data-optimum={row.isOptimum ? 'true' : 'false'}
                data-testid={row.isOptimum ? 'penalty-optimum' : 'penalty-row'}
              >
                <th scope="row" className="n">
                  <Figure value={row.ratio} decimals={2} />
                  {row.isOptimum ? <span className="sr-only"> {t.penalty.optimum}</span> : null}
                </th>
                <td className="n">
                  <Figure value={row.quantity} decimals={0} />
                </td>
                <td className="n">
                  <Figure value={row.relevantCost} decimals={2} />
                </td>
                <td className="n">
                  <Figure value={row.penaltyPercent} decimals={2} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
