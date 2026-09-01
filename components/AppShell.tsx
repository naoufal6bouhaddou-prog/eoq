'use client';

import { CURRENCIES, LOCALES, type CurrencyCode, type Locale } from '@/lib/format';

import { useSettings, type ThemeChoice } from './Settings';

export interface AppShellProps {
  onLocaleChange: (locale: Locale) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onThemeChange: (theme: ThemeChoice) => void;
  actions?: React.ReactNode;
}

const LOCALE_LABEL: Record<Locale, string> = { fr: 'FR', en: 'EN' };

/**
 * The shell every tool in the family shares.
 *
 * It names the family first and the tool second, because a reader arriving from
 * a sibling tool needs to know where they are before what they are looking at.
 * Nothing below this component knows anything about economic order quantities,
 * so a sibling imports it unchanged and passes its own tool name through the
 * dictionary.
 */
export function AppShell({
  onLocaleChange,
  onCurrencyChange,
  onThemeChange,
  actions,
}: AppShellProps) {
  const { locale, currency, theme, t } = useSettings();

  return (
    <header className="no-print border-b border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6">
        <h1 className="flex flex-wrap items-baseline gap-x-2">
          <span className="t-label text-[color:var(--text-2)]">{t.app.family}</span>
          <span aria-hidden="true" className="t-label text-[color:var(--line-strong)]">
            /
          </span>
          <span className="t-body font-semibold">{t.app.tool}</span>
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="seg t-micro" role="group" aria-label={t.app.language}>
            {LOCALES.map((option) => (
              <label
                key={option}
                data-active={option === locale}
                className="cursor-pointer"
                lang={option}
              >
                <input
                  type="radio"
                  name="app-locale"
                  className="sr-only"
                  checked={option === locale}
                  onChange={() => onLocaleChange(option)}
                />
                {LOCALE_LABEL[option]}
              </label>
            ))}
          </div>

          <label htmlFor="currency" className="sr-only">
            {t.app.currency}
          </label>
          <select
            id="currency"
            className="btn t-micro"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
          >
            {CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="theme" className="sr-only">
            {t.app.theme}
          </label>
          <select
            id="theme"
            className="btn t-micro"
            value={theme}
            onChange={(event) => onThemeChange(event.target.value as ThemeChoice)}
          >
            <option value="system">{t.app.themeSystem}</option>
            <option value="light">{t.app.themeLight}</option>
            <option value="dark">{t.app.themeDark}</option>
          </select>

          {actions === undefined ? null : (
            <div className="flex flex-wrap items-center gap-1 border-l border-[color:var(--line)] pl-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
