/**
 * Drag gizmo for route waypoints.
 * Thin wrapper around the shared {@link EditPointGizmo}: waypoints always snap to
 * the nearest lane, and the drag result is adapted to the route's positional
 * callback (no `snapped` flag).
 */

import React, { useCallback } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { EditPointGizmo } from '../edit-shared/EditPointGizmo.js';
import type { EditPointDragResult } from '../edit-shared/EditPointGizmo.js';
import type { OrbitControlsLike } from '../store/viewer-types.js';

/** Yellow selection ring for route waypoints. */
const RING_COLOR = '#FFCC00';

interface WaypointGizmoProps {
  position: [number, number, number];
  openDriveDocument: OpenDriveDocument;
  orbitControlsRef?: React.RefObject<OrbitControlsLike | null>;
  onDragEnd?: (
    worldX: number,
    worldY: number,
    worldZ: number,
    heading: number,
    roadId: string,
    laneId: string,
    s: number,
    offset: number,
  ) => void;
}

export const WaypointGizmo: React.FC<WaypointGizmoProps> = React.memo(
  ({ position, openDriveDocument, orbitControlsRef, onDragEnd }) => {
    const handleDragEnd = useCallback(
      (r: EditPointDragResult) => {
        onDragEnd?.(r.x, r.y, r.z, r.h, r.roadId, String(r.laneId), r.s, r.offset);
      },
      [onDragEnd],
    );

    return (
      <EditPointGizmo
        position={position}
        openDriveDocument={openDriveDocument}
        orbitControlsRef={orbitControlsRef}
        color={RING_COLOR}
        snapToLane
        onDragEnd={handleDragEnd}
      />
    );
  },
);

WaypointGizmo.displayName = 'WaypointGizmo';
