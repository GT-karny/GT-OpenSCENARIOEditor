/**
 * Signal type classification and geometry constants for 3D traffic signal rendering.
 */

import type { OdrSignal } from '@osce/shared';

/** Visual category for rendering dispatch */
export type SignalCategory = 'trafficLight' | 'stopSign' | 'speedLimit' | 'generic';

/** Default pole dimensions */
export const POLE_RADIUS = 0.06;
export const POLE_COLOR = '#666666';

/** Default signal head heights (used when OdrSignal.zOffset is not set) */
export const DEFAULT_SIGNAL_HEIGHT = 5.0;

/** Default pedestrian signal height (JP standard: 2.5m) */
export const DEFAULT_PEDESTRIAN_SIGNAL_HEIGHT = 2.5;

/** Traffic light housing dimensions */
export const TRAFFIC_LIGHT = {
  housingWidth: 0.4,
  housingDepth: 0.25,
  housingHeight: 1.0,
  bulbRadius: 0.12,
  /** Vertical offsets for each bulb relative to housing center */
  bulbOffsets: [0.33, 0, -0.33] as const, // red (top), yellow (mid), green (bottom)
  bulbColors: {
    red: '#FF0000',
    yellow: '#FFAA00',
    green: '#00CC44',
  },
  /** Desaturated bulb colors used for the off state */
  offBulbColors: {
    red: '#4A1010',
    yellow: '#3A2808',
    green: '#0A3A0A',
  },
  housingColor: '#222222',
  offEmissiveIntensity: 0.02,
  onEmissiveIntensity: 1.2,
};

/** Stop sign dimensions */
export const STOP_SIGN = {
  radius: 0.4,
  faceColor: '#CC0000',
  borderColor: '#FFFFFF',
  borderWidth: 0.04,
};

/** Speed limit sign dimensions */
export const SPEED_LIMIT_SIGN = {
  radius: 0.35,
  faceColor: '#FFFFFF',
  borderColor: '#CC0000',
  borderWidth: 0.04,
  textColor: '#000000',
};

/** Generic signal dimensions */
export const GENERIC_SIGNAL = {
  width: 0.5,
  height: 0.5,
  faceColor: '#CC9900',
  borderColor: '#333333',
};

/**
 * Classify an OpenDRIVE signal into a visual category.
 *
 * Uses the `type`, `subtype`, and `dynamic` fields from OdrSignal.
 * Supports German StVO type codes and esmini conventions.
 */
export function classifySignal(signal: OdrSignal): SignalCategory {
  const type = signal.type ?? '';
  const dynamic = signal.dynamic ?? 'no';

  // Dynamic signals are generally traffic lights
  if (dynamic === 'yes') return 'trafficLight';

  // Universal preset type
  if (type === 'trafficLight') return 'trafficLight';

  // ASAM OpenDRIVE Signal Catalog: all 100xxxx types are traffic signals
  // Covers 1000001 (standard), 1000002 (pedestrian), 1000008-1000023, etc.
  if (/^100\d{4}$/.test(type)) return 'trafficLight';

  // German StVO type codes
  if (type === '206') return 'stopSign';
  if (type === '274' || type === '278') return 'speedLimit';

  return 'generic';
}
