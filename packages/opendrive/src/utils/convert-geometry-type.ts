import type { OdrGeometry, OdrGeometryBase } from '@osce/shared';

/**
 * Carry the single curvature value used by line/arc conversions.
 *
 * The road editor lets users flip a segment's geometry type while keeping its
 * curve "feel". An arc carries its constant curvature; a spiral carries its
 * start curvature. Other variants have no curvature concept, so they convert
 * to a straight default of 0. This mirrors the original `curvature ??
 * curvStart ?? 0` fallback chain with explicit per-variant narrowing.
 */
function arcCurvature(geometry: OdrGeometry): number {
  switch (geometry.type) {
    case 'arc':
      return geometry.curvature;
    case 'spiral':
      return geometry.curvStart;
    default:
      return 0;
  }
}

/**
 * Carry start/end curvatures for a spiral conversion.
 *
 * Mirrors the original per-field fallbacks:
 *   curvStart = curvature ?? curvStart ?? 0
 *   curvEnd   = curvature ?? curvEnd   ?? 0
 * For an arc source both ends take the arc curvature; for a spiral source each
 * end keeps its own value; any other source converts to a straight 0.
 */
function spiralCurvatures(geometry: OdrGeometry): { curvStart: number; curvEnd: number } {
  switch (geometry.type) {
    case 'arc':
      return { curvStart: geometry.curvature, curvEnd: geometry.curvature };
    case 'spiral':
      return { curvStart: geometry.curvStart, curvEnd: geometry.curvEnd };
    default:
      return { curvStart: 0, curvEnd: 0 };
  }
}

/**
 * Convert a geometry segment to a different type (line, arc, or spiral).
 * Preserves common base properties (s, x, y, hdg, length) and provides
 * sensible defaults for type-specific parameters.
 */
export function convertGeometryType(
  geometry: OdrGeometry,
  newType: 'line' | 'arc' | 'spiral',
): OdrGeometry {
  const base: OdrGeometryBase = {
    s: geometry.s,
    x: geometry.x,
    y: geometry.y,
    hdg: geometry.hdg,
    length: geometry.length,
  };

  switch (newType) {
    case 'line':
      return { ...base, type: 'line' };
    case 'arc':
      return {
        ...base,
        type: 'arc',
        curvature: arcCurvature(geometry),
      };
    case 'spiral':
      return {
        ...base,
        type: 'spiral',
        ...spiralCurvatures(geometry),
      };
  }
}
