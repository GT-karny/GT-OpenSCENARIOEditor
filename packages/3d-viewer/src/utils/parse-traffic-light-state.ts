/**
 * Parse esmini traffic light state strings to determine bulb activation.
 *
 * Supported formats:
 * - esmini positional: "on;off;off" (red;yellow;green order)
 * - Color name: "red", "green", "yellow"
 */

const BULB_INDEX: Record<string, number> = { red: 0, yellow: 1, green: 2 };

export function isBulbActive(stateStr: string, bulb: 'red' | 'yellow' | 'green'): boolean {
  if (stateStr.includes(';')) {
    const parts = stateStr.split(';');
    const idx = BULB_INDEX[bulb];
    return idx < parts.length && parts[idx].trim().toLowerCase() === 'on';
  }
  return stateStr.toLowerCase().includes(bulb);
}
