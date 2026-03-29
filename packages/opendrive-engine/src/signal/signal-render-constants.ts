/**
 * Shared rendering constants for traffic signal heads.
 *
 * Used by both the Canvas2D head renderer (opendrive-engine) and the
 * 3D viewer texture generator (3d-viewer).
 */

/** Pixels per metre for Canvas2D rendering. */
export const PX_PER_UNIT = 256;

/** Inter-bulb spacing in metres. */
export const BULB_SPACING = 0.38;

/** Bulb radius in metres. */
export const BULB_RADIUS = 0.12;

/** Padding around outermost bulbs in the housing. */
export const HOUSING_PADDING = 0.07;

/** Housing depth in metres. */
export const HOUSING_DEPTH = 0.12;

/** Housing cross-axis width in metres (the shorter dimension). */
export const HOUSING_WIDTH = 0.4;

/** Active bulb colours (hex). */
export const BULB_COLORS = {
  red: '#FF0000',
  yellow: '#FFAA00',
  green: '#00CC44',
} as const;

/** Desaturated bulb colours for the off state. */
export const OFF_BULB_COLORS = {
  red: '#4A1010',
  yellow: '#3A2808',
  green: '#0A3A0A',
} as const;

/** Housing background colour. */
export const HOUSING_COLOR = '#222222';
