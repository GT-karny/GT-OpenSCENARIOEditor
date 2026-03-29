/**
 * Centralized selection / highlight / hover theme constants for all 3D objects.
 *
 * Every visual feedback color and thickness in the 3D viewer should reference
 * these constants rather than hardcoding hex values.
 */

// ---------------------------------------------------------------------------
// Outline / Edge Glow — used by ApexEdgeGlow, drei Outlines
// ---------------------------------------------------------------------------

export const SELECTION_COLORS = {
  selected: '#FFFF00', // yellow
  hovered: '#44DDFF', // cyan
} as const;

export const OUTLINE_THICKNESS = {
  selected: { entity: 0.08, entitySmall: 0.06, signal: 1.6 },
  hovered: { entity: 0.15, entitySmall: 0.12, signal: 3.0 },
} as const;

// ---------------------------------------------------------------------------
// Hover material overrides — applied to meshStandardMaterial on hover
// ---------------------------------------------------------------------------

export const HOVER_MATERIAL = {
  color: '#66BBFF',
  emissive: '#55CCFF',
  emissiveIntensity: 1.2,
  opacity: 0.8,
} as const;

// ---------------------------------------------------------------------------
// HDR glow overlays — for signal highlight / pick mode (AdditiveBlending)
// ---------------------------------------------------------------------------

export const GLOW_COLORS = {
  highlight: [2.5, 1.8, 0.2] as const, // orange-yellow
  pickCurrent: [0.2, 2.5, 0.5] as const, // green
  pickOther: [2.5, 1.8, 0.2] as const, // orange (same as highlight)
  pickAvailable: [0.5, 1.5, 2.5] as const, // cyan
} as const;

export const GLOW_OPACITY = 0.55;

// ---------------------------------------------------------------------------
// Label colors
// ---------------------------------------------------------------------------

export const LABEL_COLORS = {
  entity: {
    selected: { text: '#FFFF00', bg: 'rgba(60,60,0,0.8)', border: '#FFFF00' },
    hovered: { text: '#44DDFF', bg: 'rgba(0,60,90,0.9)', border: '#44DDFF', shadow: '0 0 8px #44DDFF, 0 0 16px rgba(68,221,255,0.4)' },
    normal: { text: '#FFFFFF', bg: 'rgba(0,0,0,0.6)', border: 'transparent' },
  },
  signal: {
    highlighted: { text: '#FFD866', outline: '#3D2E00' },
    normal: { text: '#BBDDFF', outline: '#001428' },
  },
} as const;
