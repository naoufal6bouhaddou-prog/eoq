'use client';

import type { CostPenaltyRow, InputSensitivityRow, SensitivityParameter } from '@/lib/eoq';
import { SENSITIVITY_PARAMETERS } from '@/lib/eoq';
import { currencySymbol } from '@/lib/format';

import { Figure } from './Figure';
import { useSettings } from './Settings';

export interface SensitivityTablesProps {
  penaltyRows: CostPenaltyRow[];
  sensitivityRows: InputSensitivityRow[];
}

/**
 * The two sensitivity tables.
 *
 * The first is the most useful output on the page for a practitioner: the EOQ
 * cost curve is flat near its minimum, so ordering a fifth away from Q* costs
 * about two and a half percent. A buyer who cannot order 707 can stop worrying
 * about it.
 *
 * The second makes the same point about estimating the inputs. Q* moves with
 * the square root of D and S and inversely with the square root of H, so a 20%
 * error in an input moves the answer by under 10%.
 *
 * Percentages are given to one decimal throughout the tool, except for the
 * penalty against the optimum, which gets two: how small that number is
 * happens to be the entire point of it.
 */
export function SensitivityTables({ penaltyRows, sensitivityRows }: SensitivityTablesProps) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  const parameterLabel = (parameter: SensitivityParameter): string =>
    t.sensitivity.parameters[parameter];

  return (
    <div className="sensitivity-pair grid gap-x-8 xl:grid-cols-2">
      <section className="border-b border-[color:var(--c-rule)]">
        <div className="px-4 pt-3">
          <h2 className="t-label">{t.sections.penalty}</h2>
          <p className="t-micro mt-1 max-w-[62ch] text-[color:var(--c-ink-muted)]">
            {t.penalty.caption}
          </p>
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
                    {row.isOptimum ? (
                      <span className="sr-only"> {t.penalty.optimum}</span>
                    ) : null}
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

      <section className="border-b border-[color:var(--c-rule)]">
        <div className="px-4 pt-3">
          <h2 className="t-label">{t.sections.sensitivity}</h2>
          <p className="t-micro mt-1 max-w-[62ch] text-[color:var(--c-ink-muted)]">
            {t.sensitivity.caption}
          </p>
        </div>

        <div className="table-scroll px-4 py-2">
          <table className="banded t-body" data-testid="sensitivity-table">
            <caption className="sr-only">{t.sections.sensitivity}</caption>
            <thead>
              <tr>
                <th scope="col">{t.sensitivity.columns.parameter}</th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.deviation}
                </th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.value}
                </th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.quantity}
                </th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.quantityChange} <span className="unit">%</span>
                </th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.relevantCost} <span className="unit">{symbol}</span>
                </th>
                <th scope="col" className="n">
                  {t.sensitivity.columns.relevantCostChange} <span className="unit">%</span>
                </th>
              </tr>
            </thead>

            {/* One body per input, so the parameter is named once rather than
                repeated down five rows. */}
            {SENSITIVITY_PARAMETERS.map((parameter) => {
              const rows = sensitivityRows.filter((row) => row.parameter === parameter);
              return (
                <tbody key={parameter}>
                  {rows.map((row, index) => (
                    <tr
                      key={`${parameter}-${row.deviation}`}
                      data-optimum={row.isBaseline ? 'true' : 'false'}
                    >
                      {index === 0 ? (
                        <th scope="rowgroup" rowSpan={rows.length}>
                          {parameterLabel(parameter)}
                        </th>
                      ) : null}
                      <td className="n">
                        {row.isBaseline ? (
                          <span className="text-[color:var(--c-ink-muted)]">
                            {t.sensitivity.baseline}
                          </span>
                        ) : (
                          <>
                            <Figure value={row.deviation * 100} decimals={0} signed />
                            <span className="unit"> %</span>
                          </>
                        )}
                      </td>
                      <td className="n">
                        <Figure value={row.parameterValue} decimals={2} />
                      </td>
                      <td className="n">
                        <Figure value={row.quantity} decimals={1} />
                      </td>
                      <td className="n">
                        <Figure value={row.quantityChangePercent} decimals={1} signed />
                      </td>
                      <td className="n">
                        <Figure value={row.relevantCost} decimals={2} />
                      </td>
                      <td className="n">
                        <Figure value={row.relevantCostChangePercent} decimals={1} signed />
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      </section>
    </div>
  );
}
