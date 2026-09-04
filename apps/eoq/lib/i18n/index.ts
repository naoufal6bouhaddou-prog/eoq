import type { Locale } from '@sct/shared/lib/format';

import { en, type Dictionary } from './en';
import { fr } from './fr';

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** BCP 47 tag for the <html lang> attribute. */
export function htmlLang(locale: Locale): string {
  return locale === 'fr' ? 'fr' : 'en';
}
