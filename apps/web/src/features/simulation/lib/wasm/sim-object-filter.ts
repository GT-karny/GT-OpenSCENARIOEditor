/**
 * Filtering for simulator-generated synthetic objects.
 *
 * The GT_Sim WASM synthesizes objects with very large ids that are NOT part of
 * the authored scenario and confuse users if surfaced in the runtime object list:
 *   - crosswalks         id >= 900000000
 *   - bridges            id >= 910000000
 *   - objectReference    id >= 920000000  (clones)
 *
 * A single threshold (900000000) covers all synthetic categories. These are
 * hidden by default; a user toggle can reveal them.
 */

/** Ids at or above this value are simulator-generated synthetic objects. */
export const SIM_GENERATED_OBJECT_ID_MIN = 900_000_000;

/** Whether an object id belongs to a simulator-generated synthetic object. */
export function isSimGeneratedObject(id: number): boolean {
  return id >= SIM_GENERATED_OBJECT_ID_MIN;
}

/**
 * Whether an object should be VISIBLE in the runtime object list.
 * Authored objects are always visible; synthetic ones only when the toggle is on.
 */
export function isSimObjectVisible(id: number, showSimGenerated: boolean): boolean {
  return showSimGenerated || !isSimGeneratedObject(id);
}

/**
 * Filter a list of objects (anything with a numeric `id`) down to the ones that
 * should be visible given the toggle. Default (toggle off) hides synthetic objects.
 */
export function filterSimObjects<T extends { id: number }>(
  objects: readonly T[],
  showSimGenerated: boolean,
): T[] {
  if (showSimGenerated) return objects.slice();
  return objects.filter((o) => !isSimGeneratedObject(o.id));
}
