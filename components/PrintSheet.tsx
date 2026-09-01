'use client';

import { useEffect, useState } from 'react';

import type { Derived } from '@/lib/derive';
import { assumptions } from '@/lib/report';
import type { ToolState } from '@/lib/state';

import { useSettings } from './Settings';

export interface PrintSheetProps {
  state: ToolState;
  derived: Derived;
}

/** The sheet's title line. Only ever on paper. */
export function PrintHeader() {
  const { t } = useSettings();
  return (
    <div className="print-only mb-2 border-b border-[color:var(--line)] pb-1">
      <h1 className="t-body font-semibold">{t.app.name}</h1>
    </div>
  );
}

/**
 * What was assumed, and when. A printed sheet outlives the browser tab it came
 * from, so it has to carry its own inputs: a page of results with no record of
 * what produced them is not evidence of anything.
 */
export function PrintFooter({ state, derived }: PrintSheetProps) {
  const { locale, currency, t } = useSettings();
  const [printedOn, setPrintedOn] = useState('');

  // Rendered after mount: a date on the server and a date in the browser would
  // not agree, and this is the only value on the page that is not derived.
  useEffect(() => {
    setPrintedOn(
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        dateStyle: 'long',
      }).format(new Date()),
    );
  }, [locale]);

  const rows = assumptions({ state, derived, t, locale, currency });

  return (
    <footer className="print-only mt-3 border-t border-[color:var(--line)] pt-2">
      <h2 className="t-label mb-1">{t.print.assumptions}</h2>
      <ul className="grid grid-cols-3 gap-x-6 gap-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="t-micro flex items-baseline justify-between gap-2">
            <span className="text-[color:var(--text-2)]">{row.label}</span>
            <span className="num">
              {row.value}
              {row.unit === '' ? null : <span className="unit"> {row.unit}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="t-micro mt-1.5 flex flex-wrap justify-between gap-x-6 text-[color:var(--text-2)]">
        <span>{t.print.model}</span>
        <span>
          {t.print.generated} {printedOn}
        </span>
      </p>
    </footer>
  );
}
