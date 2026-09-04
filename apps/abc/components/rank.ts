import type { AbcClass } from '@/lib/classify';

/**
 * Where a band sits on the ordinal ramp the shared layer defines.
 *
 * The mapping lives in one place because it is the whole of what ties this
 * tool's three classes to the family's three-step ramp. The shared layer has
 * ranks and no opinion about what is being ranked; this file is the opinion.
 */
export function rankOf(abcClass: AbcClass): 1 | 2 | 3 {
  return abcClass === 'A' ? 1 : abcClass === 'B' ? 2 : 3;
}
