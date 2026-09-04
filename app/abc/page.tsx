'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { classify } from '@/lib/abc/classify';
import { getAbcDictionary } from '@/lib/abc/i18n';
import {
  blankRow,
  exampleRows,
  reformatRows,
  toItems,
  type ItemRow,
} from '@/lib/abc/rows';
import { ClassSummary } from '@/components/abc/ClassSummary';
import { ItemTable } from '@/components/abc/ItemTable';
import { ParetoChart } from '@/components/abc/ParetoChart';
import { SettingsProvider, useSettings } from '@/components/abc/Settings';
import type { CurrencyCode, Locale } from '@/shared/lib/format';
import { AppShell } from '@/shared/ui/AppShell';
import { SETTINGS_STORAGE_KEY } from '@/shared/ui/settings';

/**
 * Layout effects run after the DOM is committed but before the browser paints,
 * so the resolved language is in place before there is anything on screen to
 * read. A plain effect leaves a window in which the table is showing English
 * numbers to a French reader. useLayoutEffect has no meaning while
 * prerendering, hence the guard.
 */
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface StoredSettings {
  locale?: Locale;
  currency?: CurrencyCode;
}

function readStoredSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw === null ? {} : (JSON.parse(raw) as StoredSettings);
  } catch {
    // A blocked or full localStorage is not a reason to fail to load.
    return {};
  }
}

export default function AbcPage() {
  const [locale, setLocale] = useState<Locale>('fr');
  const [currency, setCurrency] = useState<CurrencyCode>('MAD');

  // The page opens analysed. There is no reading of an empty table, and a
  // visitor who will spend ninety seconds here should spend none of them
  // wondering what to type.
  const [rows, setRows] = useState<ItemRow[]>(() => exampleRows('fr'));
  const ready = useRef(false);

  /* ---- First load: stored settings, then the example in that language ---- */
  useBeforePaint(() => {
    const stored = readStoredSettings();
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('lang');

    // A link's own language wins, then a remembered choice, then the browser's.
    // The same order as the sibling tool, so the family answers a reader the
    // same way whichever of the two they happen to open first. Currency starts
    // at MAD in both and is remembered once changed.
    const resolved: Locale =
      requested === 'fr' || requested === 'en'
        ? requested
        : (stored.locale ??
          (typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en'));

    setLocale(resolved);
    if (stored.currency !== undefined) setCurrency(stored.currency);

    // Nothing has been typed yet, so the example is rebuilt outright rather
    // than reformatted: its names are still the tool's, not the reader's.
    setRows(exampleRows(resolved));
    ready.current = true;

    // A hook for the end-to-end suite: React attaches its handlers during
    // hydration, and until then a click on a button does nothing at all.
    document.documentElement.dataset.ready = 'true';
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ locale, currency }));
    } catch {
      // Nothing to do: the tool works fine without a remembered preference.
    }
  }, [locale, currency]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => getAbcDictionary(locale), [locale]);

  // The whole computation, on every keystroke. It is a sort and two passes
  // over at most a few hundred rows, which is nothing next to the render it
  // feeds, so there is no calculate button and nothing to keep in step.
  const analysis = useMemo(() => classify(toItems(rows, locale)), [rows, locale]);

  const changeLocale = useCallback(
    (next: Locale) => {
      // Figures follow the reader's convention. Names do not: by now they may
      // have been edited, and rewriting them would be editing the data.
      setRows((current) => reformatRows(current, locale, next));
      setLocale(next);
    },
    [locale],
  );

  const edit = useCallback((id: string, patch: Partial<Omit<ItemRow, 'id'>>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  // Removing the last row would leave nothing to type into, so the table
  // always keeps one. Clearing is never a door that closes behind you.
  const remove = useCallback((id: string) => {
    setRows((current) => {
      const kept = current.filter((row) => row.id !== id);
      return kept.length === 0 ? [blankRow()] : kept;
    });
  }, []);

  const add = useCallback(() => {
    setRows((current) => [...current, blankRow()]);
  }, []);

  const actions = (
    <>
      <button
        type="button"
        className={`t-micro ${analysis.isEmpty ? 'btn btn-primary' : 'btn'}`}
        data-testid="load-example"
        onClick={() => setRows(exampleRows(locale))}
      >
        {t.actions.loadExample}
      </button>
      <button
        type="button"
        className="btn btn-quiet t-micro"
        data-testid="clear-all"
        onClick={() => setRows([blankRow()])}
      >
        {t.actions.clearAll}
      </button>
    </>
  );

  return (
    <SettingsProvider value={{ locale, currency, t }}>
      <a href="#items" className="sr-only">
        {t.a11y.skipToTable}
      </a>

      <AppShell
        labels={{
          family: t.app.family,
          tool: t.app.tool,
          language: t.app.language,
          currency: t.app.currency,
          siblings: t.app.siblings,
        }}
        siblings={[{ href: '/', label: t.app.ordering }]}
        onLocaleChange={changeLocale}
        onCurrencyChange={setCurrency}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 sm:px-6">
        <div className="grid gap-4">
          <section>
            <h2 className="t-figure-lg font-sans">{t.intro.title}</h2>
            <p className="note t-body mt-1 text-[color:var(--text-2)]">{t.intro.lead}</p>
          </section>

          {analysis.isEmpty ? <EmptyState /> : <ParetoChart analysis={analysis} />}

          {analysis.isEmpty ? null : <ClassSummary bands={analysis.bands} />}

          <ItemTable
            rows={rows}
            analysis={analysis}
            onEdit={edit}
            onRemove={remove}
            onAdd={add}
            actions={actions}
          />
        </div>
      </main>
    </SettingsProvider>
  );
}

/**
 * What stands where the chart does when there is no value to chart. It says
 * what to type and leaves the example one click away, immediately above it.
 */
function EmptyState() {
  const { t } = useSettings();

  return (
    <section className="panel" data-testid="empty-state">
      <div className="panel-head">
        <h2 className="t-label">{t.sections.chart}</h2>
      </div>
      <div className="panel-body py-8">
        <p className="t-figure font-sans">{t.empty.title}</p>
        <p className="note t-body mt-2 text-[color:var(--text-2)]">{t.empty.message}</p>
        <p className="note t-micro mt-1 text-[color:var(--text-2)]">{t.empty.exampleHint}</p>
      </div>
    </section>
  );
}
