'use client';

import { useEffect, useState } from 'react';

import type { EoqResult } from '@/lib/eoq';
import { currencySymbol } from '@/shared/lib/format';

import { ANSWER_PANEL_ID } from './AnswerPanel';
import { Measure } from '@/shared/ui/Figure';
import { useSettings } from './Settings';

/**
 * The answer, pinned to the top of the viewport once it has scrolled away.
 *
 * It renders only while the answer panel is off screen, so the two figures are
 * never on screen twice and never in the accessibility tree twice. An earlier
 * attempt hid one copy by breakpoint instead, which meant a printed sheet from
 * a phone lost the two figures that matter.
 *
 * Fixed rather than sticky, and deliberately: sticky keeps the element in
 * normal flow, so mounting it pushed the page down far enough to bring the
 * answer panel back into view, which unmounted it, which pushed the page back
 * up. Taking it out of flow breaks that loop.
 */
export function PinnedAnswer({ eoq }: { eoq: EoqResult | null }) {
  const { locale, currency, t } = useSettings();
  const symbol = currencySymbol(currency, locale);
  const [answerOnScreen, setAnswerOnScreen] = useState(true);

  useEffect(() => {
    const panel = document.getElementById(ANSWER_PANEL_ID);
    if (panel === null) return;

    // No margin and no threshold: the pinned copy appears only once the panel
    // has left the viewport entirely. Any inset here would put the same figure
    // on screen twice while the panel was still partly readable.
    const observer = new IntersectionObserver(([entry]) =>
      setAnswerOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, [eoq === null]);

  if (eoq === null || answerOnScreen) return null;

  return (
    <div className="no-print fixed inset-x-0 top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-baseline gap-x-8 gap-y-1 px-4 py-2 sm:px-6">
        <p className="flex items-baseline gap-2">
          <span className="t-micro text-[color:var(--text-2)]">{t.results.quantityShort}</span>
          <span className="t-figure-lg num">
            <Measure
              value={eoq.quantity}
              decimals={1}
              unit={t.units.units}
              width={6}
              testId="pinned-quantity"
            />
          </span>
        </p>
        <p className="flex items-baseline gap-2">
          <span className="t-micro text-[color:var(--text-2)]">
            {t.results.relevantCostShort}
          </span>
          <span className="t-figure-lg num">
            <Measure
              value={eoq.relevantCost}
              decimals={2}
              unit={symbol}
              width={8}
              testId="pinned-trc"
            />
          </span>
        </p>
      </div>
    </div>
  );
}
