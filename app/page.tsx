'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CostCurve } from '@/components/CostCurve';
import { Figure } from '@/components/Figure';
import { InputRail } from '@/components/InputRail';
import { ResultsBand } from '@/components/ResultsBand';
import { SettingsProvider, type ThemeChoice } from '@/components/Settings';
import { StickySummary } from '@/components/StickySummary';
import { TitleBlock } from '@/components/TitleBlock';
import { derive } from '@/lib/derive';
import type { CurrencyCode, Locale } from '@/lib/format';
import { getDictionary } from '@/lib/i18n';
import {
  BLANK_STATE,
  EXAMPLE_STATE,
  decodeState,
  encodeState,
  reformatState,
  type ToolState,
} from '@/lib/state';
import type { FieldName } from '@/lib/validate';

const STORAGE_KEY = 'eoq-calculator-settings';

interface StoredSettings {
  locale?: Locale;
  currency?: CurrencyCode;
  theme?: ThemeChoice;
}

function readStoredSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? {} : (JSON.parse(raw) as StoredSettings);
  } catch {
    // A blocked or full localStorage is not a reason to fail to load.
    return {};
  }
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>('fr');
  const [currency, setCurrency] = useState<CurrencyCode>('MAD');
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [state, setState] = useState<ToolState>(() => reformatState(BLANK_STATE, 'en', 'fr'));
  const [revealErrors, setRevealErrors] = useState(false);
  const ready = useRef(false);

  /* ---- First load: stored settings, then the URL, then the example ---- */
  useEffect(() => {
    const stored = readStoredSettings();
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('lang');

    const resolved: Locale =
      requested === 'fr' || requested === 'en'
        ? requested
        : (stored.locale ??
          (typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en'));

    setLocale(resolved);
    if (stored.currency !== undefined) setCurrency(stored.currency);
    if (stored.theme !== undefined) setTheme(stored.theme);

    // A clear field unless the URL carries one: the tool opens ready for the
    // user's own numbers, and the worked example is one button away.
    const shared = decodeState(window.location.search, resolved);
    setState(shared ?? reformatState(BLANK_STATE, 'en', resolved));
    ready.current = true;
  }, []);

  /* ---- Persist the three settings, and reflect them on <html> ---- */
  useEffect(() => {
    if (!ready.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, currency, theme }));
    } catch {
      // Nothing to do: the tool works fine without a remembered preference.
    }
  }, [locale, currency, theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = theme;
  }, [theme]);

  /* ---- Keep the URL in step, so a result can be shared or bookmarked ---- */
  useEffect(() => {
    if (!ready.current) return;
    const timer = window.setTimeout(() => {
      const query = encodeState(state, locale);
      const url = `${window.location.pathname}?${query}&lang=${locale}`;
      window.history.replaceState(null, '', url);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state, locale]);

  const t = useMemo(() => getDictionary(locale), [locale]);
  const derived = useMemo(() => derive(state, locale), [state, locale]);

  const patch = useCallback((update: Partial<ToolState>) => {
    setState((current) => ({ ...current, ...update }));
  }, []);

  const changeLocale = useCallback(
    (next: Locale) => {
      setState((current) => reformatState(current, locale, next));
      setLocale(next);
    },
    [locale],
  );

  const missingLabels = derived.missing.map(
    (field: FieldName) => t.fields[field].label,
  );

  const settings = useMemo(() => ({ locale, currency, theme, t }), [locale, currency, theme, t]);

  // The chart draws the discount curve only when there is a valid schedule to
  // draw; otherwise it shows the three classic traces.
  const discountChart = useMemo(
    () =>
      derived.discounts !== null && derived.basis !== null
        ? {
            basis: derived.basis,
            breaks: derived.priceBreaks,
            analysis: derived.discounts,
          }
        : null,
    [derived.discounts, derived.basis, derived.priceBreaks],
  );

  return (
    <SettingsProvider value={settings}>
      <a href="#results" className="sr-only">
        {t.a11y.skipToResults}
      </a>

      <TitleBlock
        onLocaleChange={changeLocale}
        onCurrencyChange={setCurrency}
        onThemeChange={setTheme}
        actions={
          <>
            <button
              type="button"
              className="control t-micro"
              onClick={() => {
                setState(reformatState(EXAMPLE_STATE, 'en', locale));
                setRevealErrors(false);
              }}
            >
              {t.actions.loadExample}
            </button>
            <button
              type="button"
              className="control t-micro"
              onClick={() => {
                setState(reformatState(BLANK_STATE, 'en', locale));
                setRevealErrors(false);
              }}
            >
              {t.actions.clear}
            </button>
          </>
        }
      />

      <StickySummary eoq={derived.eoq} />

      <main className="mx-auto max-w-[1440px] px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <form
            aria-label={t.a11y.inputRail}
            className="order-2 pt-4 lg:order-1 lg:border-r lg:border-[color:var(--c-rule)] lg:pr-6"
            onSubmit={(event) => {
              event.preventDefault();
              setRevealErrors(true);
            }}
          >
            <InputRail
              state={state}
              patch={patch}
              issues={derived.issues}
              revealErrors={revealErrors}
            />
          </form>

          <div id="results" className="order-1 min-w-0 pt-4 lg:order-2">
            <ResultsBand
              eoq={derived.eoq}
              practical={derived.practical}
              missingLabels={missingLabels}
            />

            {derived.eoq === null || derived.eoqInput === null ? null : (
              <CostCurve
                input={derived.eoqInput}
                eoq={derived.eoq}
                discounts={discountChart}
              />
            )}

            {derived.eoq === null ? null : (
              <section className="border-b border-[color:var(--c-rule)] px-4 py-3">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="t-micro text-[color:var(--c-ink-muted)]">
                      {t.results.averageInventory}
                    </dt>
                    <dd className="t-body num">
                      <Figure value={derived.eoq.averageInventory} decimals={1} />
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="t-micro text-[color:var(--c-ink-muted)]">
                      {t.results.closedForm}
                    </dt>
                    <dd className="t-body num">
                      <Figure value={derived.eoq.relevantCostClosedForm} decimals={2} />
                    </dd>
                  </div>
                  {derived.eoq.purchaseCost === null ? null : (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="t-micro text-[color:var(--c-ink-muted)]">
                        {t.results.purchaseCost}
                      </dt>
                      <dd className="t-body num">
                        <Figure value={derived.eoq.purchaseCost} decimals={2} />
                      </dd>
                    </div>
                  )}
                  {derived.eoq.totalCost === null ? null : (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="t-micro text-[color:var(--c-ink-muted)]">
                        {t.results.totalCost}
                      </dt>
                      <dd className="t-body num">
                        <Figure value={derived.eoq.totalCost} decimals={2} />
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </div>
        </div>
      </main>
    </SettingsProvider>
  );
}
