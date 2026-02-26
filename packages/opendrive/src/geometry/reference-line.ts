/**
 * Road reference line evaluator.
 * Dispatches to the appropriate geometry evaluator based on segment type.
 */
import type { OdrGeometry } from '@osce/shared';
import type { Pose2D } from './types.js';
import { evaluateLine } from './line.js';
import { evaluateArc } from './arc.js';
import { evaluateSpiral } from './spiral.js';
import { evaluatePoly3 } from './poly3.js';
import { evaluateParamPoly3 } from './param-poly3.js';

/**
 * Evaluate the road reference line at a given s coordinate.
 * Finds the correct geometry segment and computes world (x, y, hdg).
 */
export function evaluateReferenceLineAtS(
  planView: readonly OdrGeometry[],
  s: number,
): Pose2D {
  if (planView.length === 0) {
    return { x: 0, y: 0, hdg: 0 };
  }

  const geom = findGeometryAtS(planView, s);
  const ds = Math.max(0, s - geom.s);
  // Clamp ds to geometry length
  const clampedDs = Math.min(ds, geom.length);

  return evaluateGeometry(clampedDs, geom);
}

/**
 * Evaluate a single geometry segment at local distance ds from its start.
 */
export function evaluateGeometry(ds: number, geom: OdrGeometry): Pose2D {
  switch (geom.type) {
    case 'line':
      return evaluateLine(ds, geom);
    case 'arc':
      return evaluateArc(ds, geom);
    case 'spiral':
      return evaluateSpiral(ds, geom);
    case 'poly3':
      return evaluatePoly3(ds, geom);
    case 'paramPoly3':
      return evaluateParamPoly3(ds, geom);
    default:
      return evaluateLine(ds, geom);
  }
}

/**
 * Find the geometry segment that contains the given s coordinate.
 * Returns the last geometry where geom.s <= s.
 */
function findGeometryAtS(
  planView: readonly OdrGeometry[],
  s: number,
): OdrGeometry {
  let lo = 0;
  let hi = planView.length - 1;
  let result = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (planView[mid].s <= s) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return planView[result];
}
