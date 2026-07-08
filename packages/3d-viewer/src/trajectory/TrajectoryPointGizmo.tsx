/**
 * Drag gizmo for trajectory points (vertices and control points).
 * Thin wrapper around the shared {@link EditPointGizmo} with the trajectory ring
 * colour; supports lane snapping or free placement and reports the `snapped` flag
 * through the positional callback.
 */

import React, { useCallback } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { EditPointGizmo } from '../edit-shared/EditPointGizmo.js';
import type { EditPointDragResult } from '../edit-shared/EditPointGizmo.js';
import type { OrbitControlsLike } from '../store/viewer-types.js';

/** Orange selection ring for trajectory points. */
const RING_COLOR = '#FFAA00';

interface TrajectoryPointGizmoProps {
  position: [number, number, number];
  openDriveDocument: OpenDriveDocument | null;
  orbitControlsRef?: React.RefObject<OrbitControlsLike | null>;
  snapToLane?: boolean;
  onDragEnd?: (
    worldX: number,
    worldY: number,
    worldZ: number,
    heading: number,
    roadId: string,
    laneId: string,
    s: number,
    offset: number,
    snapped: boolean,
  ) => void;
}

export const TrajectoryPointGizmo: React.FC<TrajectoryPointGizmoProps> = React.memo(
  ({ position, openDriveDocument, orbitControlsRef, snapToLane = true, onDragEnd }) => {
    const handleDragEnd = useCallback(
      (r: EditPointDragResult) => {
        onDragEnd?.(r.x, r.y, r.z, r.h, r.roadId, String(r.laneId), r.s, r.offset, r.snapped);
      },
      [onDragEnd],
    );

    return (
      <EditPointGizmo
        position={position}
        openDriveDocument={openDriveDocument}
        orbitControlsRef={orbitControlsRef}
        color={RING_COLOR}
        snapToLane={snapToLane}
        onDragEnd={handleDragEnd}
      />
    );
  },
);

TrajectoryPointGizmo.displayName = 'TrajectoryPointGizmo';
