'use client';

import type { EoqResult } from '@/lib/eoq';
import { currencySymbol } from '@/lib/format';

import { Measure } from './Figure';
import { useSettings } from './Settings';

/**
 * The two answers, pinned to the top of a narrow viewport.
 *
 * It sits outside the main grid on purpose: a sticky element can only travel
 * as far as its containing block, and inside the results column it would come
 * unstuck the moment the inputs began. Here its containing block is the page,
 * so it stays put however far down the form the user is working.
 *
 * Above the wide breakpoint this is hidden and the same two figures take their
 * places in the four-across results band instead, so neither the reader nor a
 * screen reader ever meets both.
 */
export function StickySummary({ eoq }: { eoq: EoqResult | null }) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);

  if (eoq === null) return null;

  return (
    <div className="no-print sticky top-0 z-20 border-b border-[color:var(--c-rule)] bg-[color:var(--c-paper)] xl:hidden">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-1">
        <div className="min-w-0 px-3 py-2">
          <p className="t-label mb-1 text-[color:var(--c-ink-muted)]">{t.results.quantity}</p>
          <p className="t-figure-lg num">
            <Measure
              value={eoq.quantity}
              decimals={1}
              unit={t.units.units}
              width={6}
              testId="result-quantity"
            />
          </p>
        </div>
        <div className="min-w-0 border-l border-[color:var(--c-rule)] px-3 py-2">
          <p className="t-label mb-1 text-[color:var(--c-ink-muted)]">{t.results.relevantCost}</p>
          <p className="t-figure-lg num">
            <Measure
              value={eoq.relevantCost}
              decimals={2}
              unit={symbol}
              width={8}
              testId="result-trc"
            />
          </p>
        </div>
      </div>
    </div>
  );
}
