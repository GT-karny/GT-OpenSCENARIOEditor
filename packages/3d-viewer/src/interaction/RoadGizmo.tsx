/**
 * Custom gizmo for road-coordinate entity manipulation.
 * Replaces TransformControls when entities should move along road coordinates.
 *
 * - S-axis arrow (red): drags entity along road s parameter
 * - Lane-axis arrow (green): drags entity to adjacent lane centers
 *
 * Uses useDragOnPlane hook for drag mechanics.
 */

import React, { useRef, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToLane } from '@osce/opendrive';
import { roadCoordsToWorld } from '../utils/road-projection.js';
import { GizmoArrow } from './primitives/GizmoArrow.js';
import { useDragOnPlane } from './primitives/useDragOnPlane.js';

interface RoadGizmoProps {
  /** The entity's Three.js group (inside the rotation group) */
  entityRef: React.RefObject<THREE.Object3D | null>;
  openDriveDocument: OpenDriveDocument;
  currentRoadPosition: { roadId: string; laneId: number; s: number };
  orbitControlsRef?: React.RefObject<any>;
  onDragEnd?: (worldX: number, worldY: number, worldZ: number, heading: number) => void;
}

interface DragState {
  axis: 's' | 'lane';
  roadId: string;
  laneId: number;
  s: number;
}

export const RoadGizmo: React.FC<RoadGizmoProps> = ({
  entityRef,
  openDriveDocument,
  currentRoadPosition,
  orbitControlsRef,
  onDragEnd,
}) => {
  const dragRef = useRef<DragState | null>(null);

  // Keep latest values in refs for callbacks
  const propsRef = useRef({ entityRef, openDriveDocument, onDragEnd });
  propsRef.current = { entityRef, openDriveDocument, onDragEnd };

  const activeAxisRef = useRef<'s' | 'lane'>('s');

  const createPlane = useCallback(
    (_e: ThreeEvent<PointerEvent>) => {
      const eRef = propsRef.current.entityRef;
      if (!eRef.current) return null;

      // Get entity world position for drag plane
      const worldPos = new THREE.Vector3();
      eRef.current.getWorldPosition(worldPos);

      // Horizontal drag plane at entity's world height (Three.js Y = elevation)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      dragRef.current = {
        axis: activeAxisRef.current,
        roadId: currentRoadPosition.roadId,
        laneId: currentRoadPosition.laneId,
        s: currentRoadPosition.s,
      };

      return plane;
    },
    [currentRoadPosition],
  );

  const onDragMove = useCallback((intersection: THREE.Vector3) => {
    const drag = dragRef.current;
    const { entityRef: eRef, openDriveDocument: odr } = propsRef.current;
    if (!drag || !eRef.current || !odr) return;

    // Convert Three.js world → OpenDRIVE world
    // Rotation group Rx(-π/2): OpenDRIVE (x, y) = Three.js (x, -z)
    const odrX = intersection.x;
    const odrY = -intersection.z;

    if (drag.axis === 's') {
      const laneResult = worldToLane(odr, odrX, odrY, 30);
      if (laneResult && laneResult.roadId === drag.roadId) {
        const projected = roadCoordsToWorld(odr, drag.roadId, drag.laneId, laneResult.s);
        if (projected) {
          eRef.current.position.set(projected.x, projected.y, projected.z);
          eRef.current.rotation.z = projected.h;
          drag.s = projected.s;
        }
      }
    } else {
      const laneResult = worldToLane(odr, odrX, odrY, 30);
      if (laneResult && laneResult.roadId === drag.roadId) {
        if (laneResult.laneId !== drag.laneId) {
          const projected = roadCoordsToWorld(odr, drag.roadId, laneResult.laneId, drag.s);
          if (projected) {
            eRef.current.position.set(projected.x, projected.y, projected.z);
            eRef.current.rotation.z = projected.h;
            drag.laneId = projected.laneId;
          }
        }
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const { entityRef: eRef, onDragEnd: onEnd } = propsRef.current;
    if (dragRef.current && eRef.current) {
      onEnd?.(
        eRef.current.position.x,
        eRef.current.position.y,
        eRef.current.position.z,
        eRef.current.rotation.z,
      );
    }
    dragRef.current = null;
  }, []);

  const { startDrag } = useDragOnPlane({
    orbitControlsRef,
    createPlane,
    onDragMove,
    onDragEnd: handleDragEnd,
  });

  const handleSPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      activeAxisRef.current = 's';
      startDrag(e);
    },
    [startDrag],
  );

  const handleLanePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      activeAxisRef.current = 'lane';
      startDrag(e);
    },
    [startDrag],
  );

  return (
    <>
      <GizmoArrow direction="x" color="#ff4444" onPointerDown={handleSPointerDown} />
      <GizmoArrow direction="y" color="#44ff44" onPointerDown={handleLanePointerDown} />
    </>
  );
};

RoadGizmo.displayName = 'RoadGizmo';
