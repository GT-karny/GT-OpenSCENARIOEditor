/**
 * Place a road-surface reference point on the banked road surface, exactly as
 * the road mesh does (lane-boundary.ts). A `crossSectionSurface` contributes a
 * per-(s,t) height offset with no rotation; otherwise superelevation rolls the
 * lateral offset about the reference line. The two are mutually exclusive (XSD
 * assert), so exactly one path applies — keeping entities, signals, objects and
 * gizmo projections on the same surface the mesh renders.
 */

import type { OdrRoad } from '@osce/shared';
import { evaluateSuperelevation, getCrossSectionEvaluator, stToXyz } from '@osce/opendrive';

export interface BankedSurfacePoint {
  x: number;
  y: number;
  z: number;
  /** Surface roll (radians) for model tilt: superelevation angle, or 0 on a
   *  crossSectionSurface road (a height field, not a rotation). */
  roll: number;
}

/**
 * @param road   Road carrying the lateral profile.
 * @param pose   Reference-line pose at `s` (x, y, heading).
 * @param s      Road s-coordinate.
 * @param t      Lateral offset from the reference line.
 * @param zBase  Base height at (s, t) before banking (elevation + any zOffset).
 */
export function bankedSurfacePoint(
  road: OdrRoad,
  pose: { x: number; y: number; hdg: number },
  s: number,
  t: number,
  zBase: number,
): BankedSurfacePoint {
  const crossSection = getCrossSectionEvaluator(road);
  if (crossSection) {
    const p = stToXyz(pose, t, zBase + crossSection(s, t));
    return { x: p.x, y: p.y, z: p.z, roll: 0 };
  }
  const roll = evaluateSuperelevation(road.lateralProfile, s);
  const p = stToXyz(pose, t, zBase, roll);
  return { x: p.x, y: p.y, z: p.z, roll };
}
