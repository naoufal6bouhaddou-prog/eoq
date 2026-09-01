'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { CurrencyCode, Locale } from '@/lib/format';
import type { Dictionary } from '@/lib/i18n';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Settings {
  locale: Locale;
  currency: CurrencyCode;
  theme: ThemeChoice;
  /** The active dictionary. Named `t` because it appears on nearly every line. */
  t: Dictionary;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: Settings;
  children: ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (settings === null) throw new Error('useSettings used outside SettingsProvider');
  return settings;
}
