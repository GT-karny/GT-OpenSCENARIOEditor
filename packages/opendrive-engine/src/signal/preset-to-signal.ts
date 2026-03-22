/**
 * Convert between signal head presets and OdrSignal fields.
 */
import type { OdrSignal } from '@osce/shared';
import type { SignalHeadPreset } from './signal-presets.js';
import { BUILT_IN_PRESETS } from './signal-presets.js';

/**
 * Generate OdrSignal partial fields from a preset.
 * Uses human-readable type/subtype codes instead of DIN codes.
 */
export function presetToSignalPartial(preset: SignalHeadPreset): Partial<OdrSignal> {
  return {
    dynamic: 'yes',
    type: 'trafficLight',
    subtype: preset.id,
  };
}

/**
 * Resolve preset ID from an existing OdrSignal.
 * Checks both new preset-based subtypes and legacy DIN codes.
 */
export function signalToPresetId(signal: OdrSignal): string | null {
  // Direct match on subtype = preset ID
  if (signal.subtype && BUILT_IN_PRESETS.find((p) => p.id === signal.subtype)) {
    return signal.subtype;
  }
  // Legacy DIN mapping
  const dinMap: Record<string, string> = {
    '1000001': '3-light-vertical',
    '1000002': 'pedestrian-2',
  };
  if (signal.type && dinMap[signal.type]) {
    return dinMap[signal.type];
  }
  return null;
}
