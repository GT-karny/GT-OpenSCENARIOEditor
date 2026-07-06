import type { ViewportLayout } from './types';

/** Sanitize a numeric value: return fallback if NaN/Infinity */
function safe(v: number, fallback: number = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

/**
 * Compute SVG viewport layout that fits a world-space bounding region
 * with annotation margins, maintaining aspect ratio.
 *
 * Takes actual world-coordinate bounds (min/max) so that vehicles with
 * large center offsets or axles extending beyond the BoundingBox are
 * always fully visible.
 */
export function computeViewport(
  containerWidth: number,
  containerHeight: number,
  worldXMin: number,
  worldXMax: number,
  worldYMin: number,
  worldYMax: number,
  marginMeters: number = 1.5,
): ViewportLayout {
  const xMin = safe(worldXMin);
  const xMax = safe(worldXMax, 0.5);
  const yMin = safe(worldYMin);
  const yMax = safe(worldYMax, 0.5);

  const worldW = Math.max(xMax - xMin, 0.5);
  const worldH = Math.max(yMax - yMin, 0.5);

  const totalW = worldW + 2 * marginMeters;
  const totalH = worldH + 2 * marginMeters;

  const scaleX = containerWidth / totalW;
  const scaleY = containerHeight / totalH;
  const scale = Math.min(scaleX, scaleY);

  // Center the drawing in the viewport
  const drawnW = totalW * scale;
  const drawnH = totalH * scale;
  const padX = (containerWidth - drawnW) / 2;
  const padY = (containerHeight - drawnH) / 2;

  // originX: SVG x where world x=0 maps to
  // originY: SVG y where world y=0 (or z=0) maps to — at the bottom of the world region
  return {
    viewBoxWidth: containerWidth,
    viewBoxHeight: containerHeight,
    scale,
    originX: padX + (-xMin + marginMeters) * scale,
    originY: padY + (yMax + marginMeters) * scale, // bottom of world = yMax in world → top in SVG
  };
}

/** Convert world XZ (side view) to SVG coords. Z goes up → SVG y inverted. */
export function toSvgSide(
  wx: number,
  wz: number,
  layout: ViewportLayout,
): { x: number; y: number } {
  return {
    x: layout.originX + safe(wx) * layout.scale,
    y: layout.originY - safe(wz) * layout.scale,
  };
}

/** Convert world XY (top view) to SVG coords. Y goes left → SVG y inverted & centered. */
export function toSvgTop(
  wx: number,
  wy: number,
  layout: ViewportLayout,
  vehicleWidth: number,
): { x: number; y: number } {
  return {
    x: layout.originX + safe(wx) * layout.scale,
    y: layout.originY - (safe(wy) + safe(vehicleWidth) / 2) * layout.scale,
  };
}

/** Convert meters to SVG px */
export function m2px(meters: number, layout: ViewportLayout): number {
  return Math.abs(safe(meters)) * layout.scale;
}

/** Format a number for display (trim trailing zeros, max 2 decimals) */
export function fmt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  return Number(v.toFixed(2)).toString();
}
