import type { ScenarioAction } from '@osce/shared';
import { getActionTypeLabel } from '@osce/node-editor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunc = (...args: any[]) => string;

/**
 * Returns a short i18n-aware label for an action type (for collapsed-state tags).
 * The canonical detection/label logic lives in `@osce/node-editor`; this is the
 * only web-side adapter, added solely to layer i18n on top of the English label.
 */
export function getActionShortLabel(action: ScenarioAction, t: TranslateFunc): string {
  const key = `composer:action.${action.action.type}`;
  const result = t(key);
  // Fall back to the canonical English type label if the i18n key is not found.
  return result === key ? getActionTypeLabel(action.action.type) : result;
}
