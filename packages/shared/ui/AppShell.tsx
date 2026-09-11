'use client';

import { CURRENCIES, LOCALES, type CurrencyCode, type Locale } from '../lib/format';

import { useSettings } from './settings';

/**
 * Every word the shell puts on screen, supplied by the tool that mounts it.
 *
 * They are props rather than dictionary lookups on purpose: a shared component
 * that reaches into a particular tool's strings is not shared, it is borrowed.
 * This is the whole boundary, expressed as a type.
 */
export interface AppShellLabels {
  /**
   * The family a tool belongs to, shown before its own name. Omitted by a
   * tool that stands alone, which then names only itself.
   */
  family?: string;
  tool: string;
  language: string;
  currency: string;
  /** Names the sibling navigation. Only read when `siblings` is non-empty. */
  siblings?: string;
}

/**
 * Another tool in the family. Only the ones the reader is not already looking
 * at are passed: the shell names the current tool itself, so repeating it as a
 * link would be a tab bar with one tab always pressed.
 */
export interface AppShellSibling {
  href: string;
  label: string;
}

export interface AppShellProps {
  labels: AppShellLabels;
  onLocaleChange: (locale: Locale) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  actions?: React.ReactNode;
  siblings?: readonly AppShellSibling[];
}

const LOCALE_LABEL: Record<Locale, string> = { fr: 'FR', en: 'EN' };

/**
 * The shell every tool shares.
 *
 * Where a family is given, it is named first and the tool second, because a
 * reader arriving from a sibling tool needs to know where they are before what
 * they are looking at. A tool deployed on its own gives none, and the header
 * carries a single name rather than a path to a place no link leads.
 */
export function AppShell({
  labels,
  onLocaleChange,
  onCurrencyChange,
  actions,
  siblings = [],
}: AppShellProps) {
  const { locale, currency } = useSettings();

  return (
    <header className="no-print border-b border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="flex flex-wrap items-baseline gap-x-2">
            {labels.family === undefined ? null : (
              <>
                <span className="t-label text-[color:var(--text-2)]">{labels.family}</span>
                <span aria-hidden="true" className="t-label text-[color:var(--line-strong)]">
                  /
                </span>
              </>
            )}
            <span className="t-body font-semibold">{labels.tool}</span>
          </h1>

          {/* Where the family stops being a claim in the header and becomes
              something a reader can walk between. Quiet, because leaving is
              not what the page is for. */}
          {siblings.length === 0 ? null : (
            <nav aria-label={labels.siblings ?? labels.family}>
              <ul className="flex flex-wrap items-center gap-x-1">
                {siblings.map((sibling) => (
                  <li key={sibling.href}>
                    <a
                      href={sibling.href}
                      className="btn btn-quiet t-micro inline-flex items-center no-underline"
                    >
                      {sibling.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="seg t-micro" role="group" aria-label={labels.language}>
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
            {labels.currency}
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
