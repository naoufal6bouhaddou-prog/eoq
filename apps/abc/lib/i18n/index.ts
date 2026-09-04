import type { Locale } from '@sct/shared/lib/format';

import { en, type AbcDictionary } from './en';
import { fr } from './fr';

export type { AbcDictionary };

const DICTIONARIES: Record<Locale, AbcDictionary> = { en, fr };

export function getAbcDictionary(locale: Locale): AbcDictionary {
  return DICTIONARIES[locale];
}
