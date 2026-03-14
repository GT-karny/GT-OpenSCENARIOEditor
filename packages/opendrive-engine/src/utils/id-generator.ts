/**
 * Numeric ID generator for OpenDRIVE elements.
 * OpenDRIVE IDs should be numeric strings for esmini compatibility.
 */

/**
 * Find the next available numeric ID from a list of existing IDs.
 * Non-numeric IDs (e.g. legacy UUIDs) are ignored.
 * Returns "1" if no numeric IDs exist.
 */
export function nextNumericId(existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const n = parseInt(id, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return String(max + 1);
}
