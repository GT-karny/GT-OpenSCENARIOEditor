/**
 * Arc geometry evaluator.
 * Constant curvature road segment (circular arc).
 */
import type { OdrGeometry } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluateArc(ds: number, geom: OdrGeometry): Pose2D {
  const k = geom.curvature ?? 0;
  const cosH0 = Math.cos(geom.hdg);
  const sinH0 = Math.sin(geom.hdg);

  let u: number;
  let v: number;

  if (Math.abs(k) < 1e-12) {
    // Degenerate to line
    u = ds;
    v = 0;
  } else {
    u = Math.sin(k * ds) / k;
    v = (1 - Math.cos(k * ds)) / k;
  }

  return {
    x: geom.x + u * cosH0 - v * sinH0,
    y: geom.y + u * sinH0 + v * cosH0,
    hdg: geom.hdg + k * ds,
  };
}
