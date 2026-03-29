/**
 * 3D-specific signal rendering constants and geometry.
 *
 * classifySignal and SignalCategory are re-exported from @osce/opendrive-engine
 * where the canonical signal catalog lives.
 */

import {
  BULB_RADIUS,
  BULB_SPACING,
  BULB_COLORS,
  OFF_BULB_COLORS,
  HOUSING_COLOR,
  HOUSING_WIDTH,
} from '@osce/opendrive-engine';

// Re-export classification from canonical source
export { classifySignal } from '@osce/opendrive-engine';
export type { SignalCategory } from '@osce/opendrive-engine';

/** Default pole dimensions */
export const POLE_RADIUS = 0.06;
export const POLE_COLOR = '#666666';

/** Default signal head heights (used when OdrSignal.zOffset is not set) */
export const DEFAULT_SIGNAL_HEIGHT = 5.0;

/** Default pedestrian signal height (JP standard: 2.5m) */
export const DEFAULT_PEDESTRIAN_SIGNAL_HEIGHT = 2.5;

/**
 * 3D-specific housing depth (visual box depth, thicker than spec HOUSING_DEPTH
 * for better visibility in 3D rendering).
 */
export const HOUSING_3D_DEPTH = 0.25;

/** Traffic light 3D rendering constants (derived from shared constants) */
export const TRAFFIC_LIGHT = {
  housingWidth: HOUSING_WIDTH,
  housingDepth: HOUSING_3D_DEPTH,
  housingHeight: 1.0,
  bulbRadius: BULB_RADIUS,
  bulbSpacing: BULB_SPACING,
  bulbColors: BULB_COLORS,
  offBulbColors: OFF_BULB_COLORS,
  housingColor: HOUSING_COLOR,
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
