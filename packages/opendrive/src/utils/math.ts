/**
 * Math utilities for OpenDRIVE geometry calculations.
 */

/** Evaluate cubic polynomial: a + b*ds + c*ds^2 + d*ds^3 */
export function evalCubic(a: number, b: number, c: number, d: number, ds: number): number {
  return a + ds * (b + ds * (c + ds * d));
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (a - b) * t;
}

/** Normalize angle to [-PI, PI] */
export function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Find the last element in a sorted array where key <= target.
 * Array must be sorted ascending by key.
 */
export function findRecordAtS<T>(
  records: readonly T[],
  s: number,
  getS: (record: T) => number,
): T | undefined {
  if (records.length === 0) return undefined;

  let lo = 0;
  let hi = records.length - 1;
  let result = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (getS(records[mid]) <= s) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return records[result];
}

/** Ensure a value is an array */
export function ensureArray<T>(val: T | T[] | undefined | null): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}
