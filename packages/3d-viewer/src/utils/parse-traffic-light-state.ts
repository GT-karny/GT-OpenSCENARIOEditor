/**
 * Parse esmini traffic light state strings to determine bulb activation.
 *
 * Supported formats:
 * - esmini positional: "on;off;off" (semicolon-separated, matches bulb array order)
 *   Works for any bulb count: 1-bulb ("on"), 2-bulb ("on;off"), 3-bulb ("on;off;off")
 *   Mode tokens: "on", "off", "flashing" per bulb position
 * - Color name: "red", "green", "yellow"
 */

import type { BulbColor } from './signal-catalog.js';

/** Bulb mode — matches esmini LampMode subset relevant for editor UI. */
export type BulbMode = 'on' | 'off' | 'flashing';

const VALID_MODES = new Set<string>(['on', 'off', 'flashing']);

const BULB_INDEX: Record<string, number> = { red: 0, yellow: 1, green: 2 };

/**
 * Get the mode of a specific bulb from a state string.
 *
 * For positional format ("on;off;flashing"), returns the token at the given index.
 * For color name format ("red"), returns 'on' if matching bulb color, else 'off'.
 */
export function getBulbMode(stateStr: string, index: number, bulbColor: BulbColor): BulbMode {
  const lower = stateStr.toLowerCase().trim();

  // Positional format with semicolons: "on;off;off", "flashing;off;off"
  if (lower.includes(';')) {
    const parts = lower.split(';').map((s) => s.trim());
    if (index < parts.length) {
      const token = parts[index];
      if (VALID_MODES.has(token)) return token as BulbMode;
      // Color name at a position (e.g., "red" in esmini semantic format)
      if (token === bulbColor) return 'on';
    }
    return 'off';
  }

  // Single token, no semicolons
  if (VALID_MODES.has(lower)) {
    return index === 0 ? (lower as BulbMode) : 'off';
  }

  // Color name format: match against the bulb's color identity
  if (lower.includes(bulbColor)) return 'on';
  return 'off';
}

/** Legacy 3-bulb state check (backwards compatible). */
export function isBulbActive(stateStr: string, bulb: 'red' | 'yellow' | 'green'): boolean {
  if (stateStr.includes(';')) {
    const parts = stateStr.split(';');
    const idx = BULB_INDEX[bulb];
    const token = idx < parts.length ? parts[idx].trim().toLowerCase() : '';
    return token === 'on' || token === 'flashing';
  }
  return stateStr.toLowerCase().includes(bulb);
}

/** Check if any bulb in the state string is in flashing mode. */
export function hasFlashingBulb(stateStr: string): boolean {
  return stateStr.toLowerCase().includes('flashing');
}

/**
 * Index-based bulb activation for variable bulb counts.
 * Returns true for both 'on' and 'flashing' modes.
 */
export function isBulbActiveByIndex(
  stateStr: string,
  index: number,
  bulbColor: BulbColor,
): boolean {
  const mode = getBulbMode(stateStr, index, bulbColor);
  return mode === 'on' || mode === 'flashing';
}

/**
 * Replace all "flashing" tokens with "off" in a state string.
 * Used during the off-phase of the flashing animation cycle.
 */
export function suppressFlashing(stateStr: string): string {
  return stateStr.replace(/flashing/gi, 'off');
}
