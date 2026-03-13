import type { OdrGeometry } from '@osce/shared';

/**
 * Convert a geometry segment to a different type (line, arc, or spiral).
 * Preserves common base properties (s, x, y, hdg, length) and provides
 * sensible defaults for type-specific parameters.
 */
export function convertGeometryType(
  geometry: OdrGeometry,
  newType: 'line' | 'arc' | 'spiral',
): OdrGeometry {
  const base = {
    s: geometry.s,
    x: geometry.x,
    y: geometry.y,
    hdg: geometry.hdg,
    length: geometry.length,
  };

  switch (newType) {
    case 'line':
      return { ...base, type: 'line' as const };
    case 'arc':
      return {
        ...base,
        type: 'arc' as const,
        curvature: geometry.curvature ?? 0,
      };
    case 'spiral':
      return {
        ...base,
        type: 'spiral' as const,
        curvStart: geometry.curvature ?? geometry.curvStart ?? 0,
        curvEnd: geometry.curvature ?? geometry.curvEnd ?? 0,
      };
  }
}
