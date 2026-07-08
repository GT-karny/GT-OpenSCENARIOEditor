/**
 * Pure geometry/instancing helpers for authored road-object visualization.
 *
 * Kept free of Three.js and React so they can be unit-tested directly. The
 * RoadObjectsGroup component turns these descriptors into meshes.
 */

import type { OdrObjectRepeat } from '@osce/shared';

/** Fallback cube edge length (metres) when an object carries no dimensions. */
export const DEFAULT_OBJECT_SIZE = 0.5;

/** Hard cap on instances expanded from a single repeat entry. */
export const MAX_REPEAT_INSTANCES = 50;

/**
 * Minimal geometry description for a road object. Box when a full length×width×
 * height is authored; cylinder when only a radius is; otherwise a small cube.
 */
export type ObjectGeometryKind =
  | { kind: 'box'; length: number; width: number; height: number }
  | { kind: 'cylinder'; radius: number; height: number }
  | { kind: 'cube'; size: number };

/**
 * Choose the geometry kind for an object from its authored dimensions.
 *
 * Priority follows the P3 spec: a full box (length, width, height all present and
 * positive) → box; else a positive radius → cylinder (height defaults to the
 * fallback size when absent/zero); else a fallback cube.
 */
export function selectObjectGeometry(obj: {
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
}): ObjectGeometryKind {
  const hasBox =
    obj.length != null && obj.length > 0 &&
    obj.width != null && obj.width > 0 &&
    obj.height != null && obj.height > 0;
  if (hasBox) {
    return { kind: 'box', length: obj.length!, width: obj.width!, height: obj.height! };
  }

  if (obj.radius != null && obj.radius > 0) {
    const height = obj.height != null && obj.height > 0 ? obj.height : DEFAULT_OBJECT_SIZE;
    return { kind: 'cylinder', radius: obj.radius, height };
  }

  return { kind: 'cube', size: DEFAULT_OBJECT_SIZE };
}

/** One repeat-expanded placement in road (s, t, zOffset) coordinates. */
export interface RepeatInstance {
  s: number;
  t: number;
  zOffset: number;
}

/**
 * Expand a `<repeat distance="…">` entry into discrete instances along s.
 *
 * `t` and `zOffset` are linearly interpolated from the start/end pair (the
 * repeat overrides the object's own t/zOffset). Continuous repeats (distance ≤ 0)
 * are out of P3 scope and yield no instances. The count is capped at `cap`;
 * `clamped` reports whether the cap was hit so the caller can warn.
 */
export function expandObjectRepeat(
  repeat: OdrObjectRepeat,
  cap = MAX_REPEAT_INSTANCES,
): { instances: RepeatInstance[]; clamped: boolean } {
  if (repeat.distance <= 0 || repeat.length < 0) {
    return { instances: [], clamped: false };
  }

  const rawCount = Math.floor(repeat.length / repeat.distance) + 1;
  const count = Math.min(rawCount, cap);

  const instances: RepeatInstance[] = [];
  for (let i = 0; i < count; i++) {
    const ds = i * repeat.distance;
    const frac = repeat.length > 0 ? ds / repeat.length : 0;
    instances.push({
      s: repeat.s + ds,
      t: lerp(repeat.tStart, repeat.tEnd, frac),
      zOffset: lerp(repeat.zOffsetStart, repeat.zOffsetEnd, frac),
    });
  }

  return { instances, clamped: rawCount > cap };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
