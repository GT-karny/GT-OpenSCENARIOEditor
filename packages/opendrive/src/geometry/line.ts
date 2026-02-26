/**
 * Line geometry evaluator.
 * Straight road segment with constant heading.
 */
import type { OdrGeometry } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluateLine(ds: number, geom: OdrGeometry): Pose2D {
  return {
    x: geom.x + ds * Math.cos(geom.hdg),
    y: geom.y + ds * Math.sin(geom.hdg),
    hdg: geom.hdg,
  };
}
