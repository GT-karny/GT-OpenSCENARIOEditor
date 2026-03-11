/**
 * Parse esmini traffic light state strings to determine bulb activation.
 *
 * Supported formats:
 * - esmini positional: "on;off;off" (semicolon-separated, matches bulb array order)
 *   Works for any bulb count: 1-bulb ("on"), 2-bulb ("on;off"), 3-bulb ("on;off;off")
 * - Color name: "red", "green", "yellow"
 */

import type { BulbColor } from './signal-catalog.js';

const BULB_INDEX: Record<string, number> = { red: 0, yellow: 1, green: 2 };

/** Legacy 3-bulb state check (backwards compatible). */
export function isBulbActive(stateStr: string, bulb: 'red' | 'yellow' | 'green'): boolean {
  if (stateStr.includes(';')) {
    const parts = stateStr.split(';');
    const idx = BULB_INDEX[bulb];
    return idx < parts.length && parts[idx].trim().toLowerCase() === 'on';
  }
  return stateStr.toLowerCase().includes(bulb);
}

/**
 * Index-based bulb activation for variable bulb counts.
 *
 * For positional format ("on;off"), checks by array index.
 * For color name format ("red"), matches against the bulb's color.
 */
export function isBulbActiveByIndex(
  stateStr: string,
  index: number,
  bulbColor: BulbColor,
): boolean {
  const lower = stateStr.toLowerCase().trim();

  // Positional format with semicolons: "on;off;off"
  if (lower.includes(';')) {
    const parts = lower.split(';').map((s) => s.trim());
    return index < parts.length && parts[index] === 'on';
  }

  // Single-bulb positional: "on" or "off" (no semicolons)
  if (lower === 'on' || lower === 'off') {
    return index === 0 && lower === 'on';
  }

  // Color name format: match against the bulb's color identity
  return lower.includes(bulbColor);
}
