/**
 * Shared position-resolution helpers for the route/trajectory edit + preview stacks.
 *
 * The edit hooks and the read-only preview hooks previously each duplicated the
 * "resolve draft positions to world coords, then hand them to the curve/path math"
 * sequence. This module single-sources that glue. The actual geometry math stays
 * in `route-path-computation` / `trajectory-curve-computation`; here we only do the
 * per-point position resolution and delegate the curve computation.
 */

import type { OpenDriveDocument, Trajectory } from '@osce/shared';
import { resolvePositionToWorld } from '@osce/3d-viewer';
import type { WorldCoords, PositionResolveOptions } from '@osce/3d-viewer';
import { computeTrajectoryVisualPoints } from './trajectory-curve-computation';
import type { PointWorldPos } from '../stores/trajectory-edit-store';

/** Fallback world position used when a position cannot be resolved. */
const ORIGIN: WorldCoords = { x: 0, y: 0, z: 0, h: 0 };

/**
 * Resolve a trajectory's editable points (polyline vertices / clothoid origin /
 * nurbs control points) to world coordinates. Unresolvable points fall back to
 * the origin so index alignment with the draft is preserved.
 */
export function resolveTrajectoryPoints(
  trajectory: Trajectory,
  odrDoc: OpenDriveDocument,
  entityPositions?: Map<string, WorldCoords>,
): PointWorldPos[] {
  const positions: PointWorldPos[] = [];
  const resolveOpts: PositionResolveOptions | undefined = entityPositions
    ? { entityPositions }
    : undefined;

  switch (trajectory.shape.type) {
    case 'polyline':
      for (const vertex of trajectory.shape.vertices) {
        positions.push(resolvePositionToWorld(vertex.position, odrDoc, resolveOpts) ?? ORIGIN);
      }
      break;
    case 'clothoid':
      if (trajectory.shape.position) {
        positions.push(resolvePositionToWorld(trajectory.shape.position, odrDoc, resolveOpts) ?? ORIGIN);
      }
      break;
    case 'nurbs':
      for (const cp of trajectory.shape.controlPoints) {
        positions.push(resolvePositionToWorld(cp.position, odrDoc, resolveOpts) ?? ORIGIN);
      }
      break;
    case 'clothoidSpline':
      // One entry per segment, index-aligned with shape.segments. Segments
      // without an explicit positionStart map to the ORIGIN sentinel; the curve
      // math treats those as "chain from the previous segment end" (only the
      // first segment actually needs a resolvable start).
      for (const segment of trajectory.shape.segments) {
        positions.push(
          segment.positionStart
            ? (resolvePositionToWorld(segment.positionStart, odrDoc, resolveOpts) ?? ORIGIN)
            : ORIGIN,
        );
      }
      break;
  }

  return positions;
}

/** Resolved trajectory visualization data (world points + evaluated curve). */
export interface TrajectoryVisual {
  points: PointWorldPos[];
  curvePoints: Array<{ x: number; y: number; z: number }>;
}

/**
 * Resolve a trajectory to its world points and evaluated curve points in one call.
 * Shared by the trajectory edit hook and the trajectory preview hook.
 */
export function resolveTrajectoryVisual(
  trajectory: Trajectory,
  odrDoc: OpenDriveDocument,
  entityPositions?: Map<string, WorldCoords>,
): TrajectoryVisual {
  const points = resolveTrajectoryPoints(trajectory, odrDoc, entityPositions);
  const curvePoints = computeTrajectoryVisualPoints(trajectory, points);
  return { points, curvePoints };
}
