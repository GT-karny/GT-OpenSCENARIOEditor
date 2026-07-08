/**
 * Plan-view geometry operations.
 *
 * Pure helpers for editing a road's plan-view (the ordered list of
 * {@link OdrGeometry} segments that trace the reference line). These
 * encapsulate the cumulative-s rewalk, total-length computation, and
 * per-segment patch pattern that road-editor drag handlers rely on.
 *
 * All functions are immutable: they return fresh arrays/objects and never
 * mutate their inputs.
 */

import type { OdrGeometry, OdrGeometryUpdate } from '@osce/shared';

/**
 * Re-walk a plan-view and assign cumulative `s` values.
 *
 * Each geometry's `s` is set to the running sum of all preceding lengths,
 * starting at 0. Returns a new array of shallow-cloned geometries; the
 * discriminant (`type`) and all variant-specific fields are preserved.
 *
 * This is the canonical rewalk used after any edit that changes segment
 * lengths or removes segments.
 */
export function recalculatePlanViewS(planView: readonly OdrGeometry[]): OdrGeometry[] {
  let s = 0;
  return planView.map((g) => {
    const updated = { ...g, s };
    s += g.length;
    return updated;
  });
}

/**
 * Compute the total plan-view length as the sum of all segment lengths.
 *
 * Equivalent to the total road length used when a length-changing edit
 * requires updating `road.length` alongside `road.planView`.
 */
export function computePlanViewLength(planView: readonly OdrGeometry[]): number {
  return planView.reduce((sum, g) => sum + g.length, 0);
}

/**
 * Return a new plan-view with a single geometry patched.
 *
 * Clones the array and merges `patch` into the geometry at `index`. The
 * patch is a partial of the flat {@link OdrGeometryUpdate} field set, so it
 * may carry positional fields (`x`, `y`, `hdg`, `length`) and/or
 * variant-specific fields (e.g. `curvature`). The existing geometry's
 * discriminant is preserved unless the patch explicitly overrides `type`.
 *
 * The result is cast back to {@link OdrGeometry}: callers are responsible for
 * only supplying fields valid for the target variant (drag handlers already
 * guard variant-specific fields — e.g. `curvature` is only patched onto arc
 * segments). Out-of-range indices are ignored and the array is returned
 * unchanged (aside from the shallow clone).
 */
export function patchPlanViewGeometry(
  planView: readonly OdrGeometry[],
  index: number,
  patch: OdrGeometryUpdate,
): OdrGeometry[] {
  const next = [...planView];
  const geo = next[index];
  if (!geo) return next;
  next[index] = { ...geo, ...patch } as OdrGeometry;
  return next;
}
