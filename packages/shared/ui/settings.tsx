'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { CurrencyCode, Locale } from '../lib/format';

/**
 * What every tool in the family shares, plus its own dictionary.
 *
 * The dictionary is a type parameter rather than an import: this file must not
 * know which strings a particular tool carries, or it stops being shared. Each
 * tool binds the parameter once, in its own settings module, and its call
 * sites keep full type safety on `t`.
 */
export interface Settings<TDictionary = unknown> {
  locale: Locale;
  currency: CurrencyCode;
  /** The active dictionary. Named `t` because it appears on nearly every line. */
  t: TDictionary;
}

/**
 * Where the family's two settings live. One key for every tool, so a reader
 * who picks French and MAD in one of them does not have to pick again in the
 * next. The name is the first tool's, and is kept rather than tidied because
 * renaming it would silently discard the preference of everyone who has
 * already set one.
 */
export const SETTINGS_STORAGE_KEY = 'eoq-calculator-settings';

const SettingsContext = createContext<Settings<unknown> | null>(null);

export function SettingsProvider<TDictionary>({
  value,
  children,
}: {
  value: Settings<TDictionary>;
  children: ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings<TDictionary = unknown>(): Settings<TDictionary> {
  const settings = useContext(SettingsContext);
  if (settings === null) throw new Error('useSettings used outside SettingsProvider');
  return settings as Settings<TDictionary>;
}
