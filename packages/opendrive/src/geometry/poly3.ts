/**
 * Cubic polynomial (poly3) geometry evaluator.
 * Lateral offset: v(ds) = a + b*ds + c*ds^2 + d*ds^3
 * Forward distance: u ≈ ds
 */
import type { OdrGeometryPoly3 } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluatePoly3(ds: number, geom: OdrGeometryPoly3): Pose2D {
  const a = geom.a;
  const b = geom.b;
  const c = geom.c;
  const d = geom.d;

  const u = ds;
  const v = a + ds * (b + ds * (c + ds * d));

  // Derivative for heading: dv/ds
  const dvds = b + ds * (2 * c + ds * 3 * d);
  const localHdg = Math.atan2(dvds, 1);

  const cosH0 = Math.cos(geom.hdg);
  const sinH0 = Math.sin(geom.hdg);

  return {
    x: geom.x + u * cosH0 - v * sinH0,
    y: geom.y + u * sinH0 + v * cosH0,
    hdg: geom.hdg + localHdg,
  };
}
