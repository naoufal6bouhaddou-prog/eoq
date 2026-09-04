import type { Dictionary } from '@/lib/i18n';
import {
  SettingsProvider,
  useSettings as useSharedSettings,
  type Settings as SharedSettings,
} from '@sct/shared/ui/settings';

/**
 * This tool's binding of the shared settings context.
 *
 * The shared context is generic over the dictionary so that it can be reused by
 * a sibling tool with entirely different strings. Binding it here, once, means
 * every component in this tool still gets `t` fully typed without the shared
 * layer ever learning what an economic order quantity is.
 */
export type Settings = SharedSettings<Dictionary>;
export { SettingsProvider };

export function useSettings(): Settings {
  return useSharedSettings<Dictionary>();
}
