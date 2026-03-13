/**
 * Snap utilities for road editing.
 * Supports grid snapping and road endpoint snapping.
 */

import type { OpenDriveDocument, OdrGeometry } from '@osce/shared';

interface SnapResult {
  x: number;
  y: number;
  /** Whether a snap was applied */
  snapped: boolean;
  /** Type of snap that was applied */
  snapType?: 'grid' | 'endpoint';
  /** ID of the road whose endpoint was snapped to */
  snapRoadId?: string;
}

/** Default grid size in meters */
const DEFAULT_GRID_SIZE = 5;

/** Distance threshold for endpoint snapping (meters) */
const ENDPOINT_SNAP_THRESHOLD = 3;

/**
 * Snap a position to the nearest grid point.
 */
export function snapToGrid(x: number, y: number, gridSize: number = DEFAULT_GRID_SIZE): SnapResult {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
    snapped: true,
    snapType: 'grid',
  };
}

/**
 * Compute the end position of a road from its last geometry segment.
 */
function computeEndPosition(planView: readonly OdrGeometry[]): { x: number; y: number } | null {
  if (planView.length === 0) return null;

  const last = planView[planView.length - 1];

  if (last.type === 'arc' && last.curvature !== undefined && Math.abs(last.curvature) > 1e-10) {
    const c = last.curvature;
    const endHdg = last.hdg + c * last.length;
    const r = 1 / c;
    return {
      x: last.x + r * (Math.sin(endHdg) - Math.sin(last.hdg)),
      y: last.y + r * (-Math.cos(endHdg) + Math.cos(last.hdg)),
    };
  }

  // Line, spiral, or fallback
  return {
    x: last.x + Math.cos(last.hdg) * last.length,
    y: last.y + Math.sin(last.hdg) * last.length,
  };
}

/**
 * Snap a position to the nearest road endpoint (start or end).
 * Excludes the road being edited (excludeRoadId).
 */
export function snapToEndpoint(
  x: number,
  y: number,
  document: OpenDriveDocument,
  excludeRoadId?: string,
  threshold: number = ENDPOINT_SNAP_THRESHOLD,
): SnapResult {
  let bestDist = threshold;
  let bestResult: SnapResult = { x, y, snapped: false };

  for (const road of document.roads) {
    if (road.id === excludeRoadId) continue;
    if (road.planView.length === 0) continue;

    // Check start point
    const start = road.planView[0];
    const dStart = Math.hypot(x - start.x, y - start.y);
    if (dStart < bestDist) {
      bestDist = dStart;
      bestResult = {
        x: start.x,
        y: start.y,
        snapped: true,
        snapType: 'endpoint',
        snapRoadId: road.id,
      };
    }

    // Check end point
    const end = computeEndPosition(road.planView);
    if (end) {
      const dEnd = Math.hypot(x - end.x, y - end.y);
      if (dEnd < bestDist) {
        bestDist = dEnd;
        bestResult = {
          x: end.x,
          y: end.y,
          snapped: true,
          snapType: 'endpoint',
          snapRoadId: road.id,
        };
      }
    }
  }

  return bestResult;
}

/**
 * Apply snapping: first tries endpoint snap, then grid snap if Shift is held.
 */
export function applySnap(
  x: number,
  y: number,
  document: OpenDriveDocument,
  options: {
    gridSnap?: boolean;
    gridSize?: number;
    excludeRoadId?: string;
  } = {},
): SnapResult {
  // Priority 1: endpoint snap (always active)
  const endpointResult = snapToEndpoint(x, y, document, options.excludeRoadId);
  if (endpointResult.snapped) return endpointResult;

  // Priority 2: grid snap (when enabled)
  if (options.gridSnap) {
    return snapToGrid(x, y, options.gridSize);
  }

  return { x, y, snapped: false };
}
