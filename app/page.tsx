'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { AnswerPanel } from '@/components/AnswerPanel';
import { AppShell } from '@/shared/ui/AppShell';
import { CostCurve } from '@/components/CostCurve';
import { DiscountTable } from '@/components/DiscountTable';
import { InventoryProfile } from '@/components/InventoryProfile';
import { ExportActions } from '@/components/ExportActions';
import { Figure } from '@/shared/ui/Figure';
import { InputRail } from '@/components/InputRail';
import { ReorderPanel } from '@/components/ReorderPanel';
import { PinnedAnswer } from '@/components/PinnedAnswer';
import { PrintFooter, PrintHeader } from '@/components/PrintSheet';
import { CostPenaltyTable } from '@/components/CostPenaltyTable';
import { SettingsProvider, type ThemeChoice } from '@/components/Settings';
import { derive } from '@/lib/derive';
import type { CurrencyCode, Locale } from '@/shared/lib/format';
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

/**
 * Layout effects run after the DOM is committed but before the browser paints,
 * so state read from the URL is in place before anything is on screen to click.
 * A plain effect leaves a window in which the page is interactive but still
 * holds its defaults, and an export taken in that window would be blank.
 * useLayoutEffect has no meaning while prerendering, hence the guard.
 */
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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

  /* ---- First load: stored settings, then the URL, then a clear field ---- */
  useBeforePaint(() => {
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

    // A hook for the end-to-end suite: React attaches its handlers during
    // hydration, and until then a click on a button does nothing at all.
    // Tests wait for this rather than for a proxy that might already be true.
    document.documentElement.dataset.ready = 'true';
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

  const labelFor = (field: FieldName): string => t.fields[field].label;

  // Split what is still missing by the section that is waiting on it, so each
  // empty state names its own gaps rather than the whole form's.
  const REORDER_FIELDS: FieldName[] = [
    'averageDemand',
    'leadTime',
    'demandStdDev',
    'leadTimeStdDev',
    'cycleServiceLevel',
  ];
  const missingLabels = derived.missing
    .filter((field) => !REORDER_FIELDS.includes(field))
    .map(labelFor);
  const missingReorderLabels = derived.missing
    .filter((field) => REORDER_FIELDS.includes(field))
    .map(labelFor);

  const settings = useMemo(() => ({ locale, currency, theme, t }), [locale, currency, theme, t]);

  /**
   * What the sawtooth needs. With a reorder point in play the rate and the lead
   * time come straight from it. Without one, the demand rate is still knowable
   * as D over the working year, and the diagram degenerates to the textbook
   * case: no buffer, no lead time, replenish on reaching zero.
   */
  const profileInput = useMemo(() => {
    if (derived.eoq === null || derived.eoqInput === null) return null;
    const { annualDemand, daysPerYear } = derived.eoqInput;

    if (derived.reorder !== null && state.reorderEnabled) {
      const averageDemand = derived.values.averageDemand;
      const leadTime = derived.values.leadTime;
      if (averageDemand === undefined || leadTime === undefined) return null;
      return {
        demandRate: averageDemand,
        leadTime,
        safetyStock: derived.reorder.safetyStock,
        reorderPoint: derived.reorder.reorderPoint,
        periodLabel: state.periodUnit === 'week' ? t.units.weeks : t.units.days,
        hasReorderPoint: true,
      };
    }

    return {
      demandRate: annualDemand / daysPerYear,
      leadTime: 0,
      safetyStock: 0,
      reorderPoint: 0,
      periodLabel: t.units.days,
      hasReorderPoint: false,
    };
  }, [derived, state.reorderEnabled, state.periodUnit, t]);

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

      <AppShell
        labels={{
          family: t.app.family,
          tool: t.app.tool,
          language: t.app.language,
          currency: t.app.currency,
          theme: t.app.theme,
          themeSystem: t.app.themeSystem,
          themeLight: t.app.themeLight,
          themeDark: t.app.themeDark,
        }}
        onLocaleChange={changeLocale}
        onCurrencyChange={setCurrency}
        onThemeChange={setTheme}
        actions={
          <>
            <button
              type="button"
              className="btn btn-quiet t-micro"
              onClick={() => {
                setState(reformatState(EXAMPLE_STATE, 'en', locale));
                setRevealErrors(false);
              }}
            >
              {t.actions.loadExample}
            </button>
            <button
              type="button"
              className="btn btn-quiet t-micro"
              onClick={() => {
                setState(reformatState(BLANK_STATE, 'en', locale));
                setRevealErrors(false);
              }}
            >
              {t.actions.clear}
            </button>
            <ExportActions state={state} derived={derived} />
          </>
        }
      />

      <PinnedAnswer eoq={derived.eoq} />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-4 sm:px-6">
        <PrintHeader />

        <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <form
            aria-label={t.a11y.inputRail}
            className="panel no-print order-2 p-4 lg:order-1"
            onSubmit={(event) => {
              event.preventDefault();
              setRevealErrors(true);
            }}
          >
            <InputRail
              state={state}
              patch={patch}
              issues={derived.issues}
              scheduleIssues={derived.scheduleIssues}
              revealErrors={revealErrors}
            />
          </form>

          <div id="results" className="order-1 grid min-w-0 gap-4 lg:order-2">
            <AnswerPanel
              eoq={derived.eoq}
              practical={derived.practical}
              missingLabels={missingLabels}
            />

            {state.discountsEnabled ? (
              <DiscountTable
                analysis={derived.discounts}
                basis={derived.basis}
                hasRoundingMultiple={derived.values.roundingMultiple !== undefined}
              />
            ) : null}

            {state.reorderEnabled ? (
              <ReorderPanel
                reorder={derived.reorder}
                eoq={derived.eoq}
                missingLabels={missingReorderLabels}
              />
            ) : null}

            {derived.eoq === null || profileInput === null ? null : (
              <InventoryProfile
                orderQuantity={derived.eoq.quantity}
                demandRate={profileInput.demandRate}
                safetyStock={profileInput.safetyStock}
                reorderPoint={profileInput.reorderPoint}
                leadTime={profileInput.leadTime}
                periodLabel={profileInput.periodLabel}
                hasReorderPoint={profileInput.hasReorderPoint}
              />
            )}

            {derived.eoq === null || derived.eoqInput === null ? null : (
              <CostCurve
                input={derived.eoqInput}
                eoq={derived.eoq}
                discounts={discountChart}
              />
            )}

            {derived.penaltyRows.length === 0 ? null : (
              <CostPenaltyTable penaltyRows={derived.penaltyRows} />
            )}

          </div>
        </div>

        <PrintFooter state={state} derived={derived} />
      </main>
    </SettingsProvider>
  );
}
