import type { AbcDictionary } from '@/lib/i18n';
import {
  SettingsProvider,
  useSettings as useSharedSettings,
  type Settings as SharedSettings,
} from '@sct/shared/ui/settings';

/**
 * This tool's binding of the shared settings context.
 *
 * The shared context is generic over the dictionary precisely so a second tool
 * can bind it to strings the first has never heard of. This is that second
 * binding, and it is the whole of what the boundary costs: five lines.
 */
export type AbcSettings = SharedSettings<AbcDictionary>;
export { SettingsProvider };

export function useSettings(): AbcSettings {
  return useSharedSettings<AbcDictionary>();
}
