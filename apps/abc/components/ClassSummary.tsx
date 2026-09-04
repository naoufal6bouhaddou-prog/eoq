'use client';

import type { ClassBand } from '@/lib/classify';
import { currencySymbol } from '@sct/shared/lib/format';

import { Figure } from '@sct/shared/ui/Figure';
import { rankOf } from './rank';
import { useSettings } from './Settings';

export interface ClassSummaryProps {
  bands: readonly ClassBand[];
}

/**
 * What each class holds, in items and in money.
 *
 * The two percentage columns are the finding, and they are adjacent so it can
 * be read across a row rather than assembled from two places: a sixth of the
 * lines, four fifths of the spend. No heading and no chart. The gap between
 * 16,7 and 79,8 is the whole point, and a pair of figures that far apart does
 * not need a bar drawn under it to be believed.
 */
export function ClassSummary({ bands }: ClassSummaryProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  return (
    <section className="panel">
      <div className="table-scroll px-4 py-3">
        <table className="banded t-body" data-testid="class-summary">
          <caption className="sr-only">{t.sections.summary}</caption>
          <thead>
            <tr>
              <th scope="col">{t.summary.columns.abcClass}</th>
              <th scope="col" className="n">
                {t.summary.columns.itemCount}
              </th>
              <th scope="col" className="n">
                {t.summary.columns.itemShare}
              </th>
              <th scope="col" className="n">
                {t.summary.columns.valueShare}
              </th>
              <th scope="col" className="n">
                {t.table.columns.annualValue} <span className="unit">{symbol}</span>
              </th>
              <th scope="col" className="w-full" />
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => (
              <tr key={band.abcClass} data-testid={`band-${band.abcClass}`}>
                <th scope="row">
                  <span className="rank-chip" data-rank={rankOf(band.abcClass)}>
                    {band.abcClass}
                  </span>
                </th>
                <td className="n" data-testid={`band-${band.abcClass}-count`}>
                  <Figure value={band.itemCount} decimals={0} />
                </td>
                <td className="n" data-testid={`band-${band.abcClass}-item-share`}>
                  <Figure value={band.itemShare} decimals={1} />
                </td>
                <td className="n" data-testid={`band-${band.abcClass}-value-share`}>
                  <Figure value={band.valueShare} decimals={1} />
                </td>
                <td className="n">
                  <Figure value={band.totalValue} decimals={2} />
                </td>
                {/* Takes up the slack, so the figures stay in a tight block on
                    the left instead of spreading across the panel. */}
                <td className="w-full" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
