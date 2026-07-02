/**
 * Numeric ID generator for OpenDRIVE elements.
 * OpenDRIVE IDs should be numeric strings for esmini compatibility.
 */

import type { OpenDriveDocument } from '@osce/shared';

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

/**
 * Derive the next junction ID for a document as max(numeric junction IDs) + 1.
 * Non-numeric junction IDs are ignored. Returns "1" when there are no
 * numeric junction IDs.
 */
export function nextJunctionId(doc: OpenDriveDocument): string {
  return nextNumericId(doc.junctions.map((j) => j.id));
}
