/**
 * Operations for virtual road management.
 *
 * Virtual roads represent continuous roads in the editor that may be split
 * into multiple OdrRoad segments at junction intersection points.
 */

import type { OpenDriveDocument, OdrRoad, OdrGeometry } from '@osce/shared';
import type { VirtualRoad } from '../store/editor-metadata-types.js';

/**
 * Create a virtual road from an existing road.
 * Initially, the virtual road has a single segment (the road itself).
 */
export function createVirtualRoad(roadId: string): VirtualRoad {
  return {
    virtualRoadId: `vr_${roadId}`,
    segmentRoadIds: [roadId],
  };
}

/**
 * Get the combined geometry of all segments in a virtual road.
 * This reconstructs the original continuous road geometry for gizmo editing.
 */
export function getVirtualRoadGeometry(
  virtualRoad: VirtualRoad,
  doc: OpenDriveDocument,
): OdrGeometry[] {
  const geometries: OdrGeometry[] = [];
  let currentS = 0;

  for (const segmentId of virtualRoad.segmentRoadIds) {
    const road = doc.roads.find((r) => r.id === segmentId);
    if (!road) continue;

    for (const geo of road.planView) {
      geometries.push({
        ...geo,
        s: currentS + geo.s,
      });
    }
    currentS += road.length;
  }

  return geometries;
}

/**
 * Get the total length of a virtual road.
 */
export function getVirtualRoadLength(
  virtualRoad: VirtualRoad,
  doc: OpenDriveDocument,
): number {
  let totalLength = 0;
  for (const segmentId of virtualRoad.segmentRoadIds) {
    const road = doc.roads.find((r) => r.id === segmentId);
    if (road) totalLength += road.length;
  }
  return totalLength;
}

/**
 * Find the segment road and local s-coordinate for a given virtual road s-coordinate.
 */
export function resolveVirtualS(
  virtualRoad: VirtualRoad,
  globalS: number,
  doc: OpenDriveDocument,
): { roadId: string; localS: number } | undefined {
  let accumulatedS = 0;

  for (const segmentId of virtualRoad.segmentRoadIds) {
    const road = doc.roads.find((r) => r.id === segmentId);
    if (!road) continue;

    if (globalS <= accumulatedS + road.length) {
      return {
        roadId: segmentId,
        localS: globalS - accumulatedS,
      };
    }
    accumulatedS += road.length;
  }

  // s is beyond the virtual road's end — clamp to last segment
  const lastSegmentId = virtualRoad.segmentRoadIds[virtualRoad.segmentRoadIds.length - 1];
  if (lastSegmentId) {
    const lastRoad = doc.roads.find((r) => r.id === lastSegmentId);
    if (lastRoad) {
      return { roadId: lastSegmentId, localS: lastRoad.length };
    }
  }

  return undefined;
}

/**
 * Convert a segment road's local s-coordinate to a virtual road global s-coordinate.
 */
export function toVirtualS(
  virtualRoad: VirtualRoad,
  segmentRoadId: string,
  localS: number,
  doc: OpenDriveDocument,
): number | undefined {
  let accumulatedS = 0;

  for (const segmentId of virtualRoad.segmentRoadIds) {
    if (segmentId === segmentRoadId) {
      return accumulatedS + localS;
    }
    const road = doc.roads.find((r) => r.id === segmentId);
    if (road) accumulatedS += road.length;
  }

  return undefined;
}

/**
 * Insert a split point into a virtual road's segment list.
 * Called after SplitRoadCommand to update the virtual road tracking.
 *
 * @param virtualRoad The virtual road to update
 * @param originalRoadId The road that was split
 * @param newRoadId The new road created by the split
 * @returns Updated segment list
 */
export function insertSplitSegment(
  virtualRoad: VirtualRoad,
  originalRoadId: string,
  newRoadId: string,
): string[] {
  const segments = [...virtualRoad.segmentRoadIds];
  const idx = segments.indexOf(originalRoadId);
  if (idx === -1) return segments;

  // The split creates two roads: original (first half) and new (second half)
  // Insert the new road after the original
  segments.splice(idx + 1, 0, newRoadId);
  return segments;
}

/**
 * Remove a merged segment from a virtual road.
 * Called when a junction is removed and roads should be restored.
 * The merged road is removed from the segment list (JoinRoadsCommand absorbs it
 * into the preceding road).
 *
 * @param virtualRoad The virtual road to update
 * @param mergedRoadId The road that was merged into its predecessor
 * @returns Updated segment list
 */
export function removeMergedSegment(
  virtualRoad: VirtualRoad,
  mergedRoadId: string,
): string[] {
  return virtualRoad.segmentRoadIds.filter((id) => id !== mergedRoadId);
}

/**
 * Get the segment roads for a virtual road from the document.
 */
export function getSegmentRoads(
  virtualRoad: VirtualRoad,
  doc: OpenDriveDocument,
): OdrRoad[] {
  const roads: OdrRoad[] = [];
  for (const segmentId of virtualRoad.segmentRoadIds) {
    const road = doc.roads.find((r) => r.id === segmentId);
    if (road) roads.push(road);
  }
  return roads;
}
