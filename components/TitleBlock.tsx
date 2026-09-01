'use client';

import { CURRENCIES, LOCALES, type CurrencyCode, type Locale } from '@/lib/format';

import { useSettings, type ThemeChoice } from './Settings';

export interface TitleBlockProps {
  onLocaleChange: (locale: Locale) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onThemeChange: (theme: ThemeChoice) => void;
  actions?: React.ReactNode;
}

const LOCALE_LABEL: Record<Locale, string> = { fr: 'FR', en: 'EN' };

/**
 * The header as a drawing title block: the name of the sheet on the left, the
 * settings in ruled cells on the right. Not a nav bar; there is nowhere to
 * navigate to.
 */
export function TitleBlock({
  onLocaleChange,
  onCurrencyChange,
  onThemeChange,
  actions,
}: TitleBlockProps) {
  const { locale, currency, theme, t } = useSettings();

  return (
    <header className="border-b border-[color:var(--c-rule)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-stretch justify-between gap-y-2 px-4">
        <h1 className="t-body flex items-center py-3 font-medium">{t.app.name}</h1>

        <div className="no-print flex flex-wrap items-stretch gap-x-3 gap-y-2 py-2 sm:gap-x-4">
          <div className="flex items-center gap-1" role="group" aria-label={t.app.language}>
            {LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                className="control t-micro"
                aria-pressed={option === locale}
                lang={option}
                onClick={() => onLocaleChange(option)}
              >
                {LOCALE_LABEL[option]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-[color:var(--c-rule)] pl-3 sm:pl-4">
            <label htmlFor="currency" className="t-micro sr-only text-[color:var(--c-ink-muted)] sm:not-sr-only">
              {t.app.currency}
            </label>
            <select
              id="currency"
              className="control t-micro"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-[color:var(--c-rule)] pl-3 sm:pl-4">
            <label htmlFor="theme" className="t-micro sr-only text-[color:var(--c-ink-muted)] sm:not-sr-only">
              {t.app.theme}
            </label>
            <select
              id="theme"
              className="control t-micro"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value as ThemeChoice)}
            >
              <option value="system">{t.app.themeSystem}</option>
              <option value="light">{t.app.themeLight}</option>
              <option value="dark">{t.app.themeDark}</option>
            </select>
          </div>

          {actions === undefined ? null : (
            <div className="flex flex-wrap items-center gap-1 border-l border-[color:var(--c-rule)] pl-3 sm:pl-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
