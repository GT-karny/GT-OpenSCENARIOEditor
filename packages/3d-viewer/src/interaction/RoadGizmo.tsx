/**
 * Custom gizmo for road-coordinate entity manipulation.
 * Replaces TransformControls when entities should move along road coordinates.
 *
 * - S-axis arrow (red): drags entity along road s parameter
 * - Lane-axis arrow (green): drags entity to adjacent lane centers
 *
 * Uses pointer events + raycasting to a horizontal plane for drag tracking,
 * then projects world position to road coordinates via worldToLane/roadCoordsToWorld.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToLane } from '@osce/opendrive';
import { roadCoordsToWorld } from '../utils/road-projection.js';

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
  plane: THREE.Plane;
}

const ARROW_LEN = 6;
const SHAFT_R = 0.12;
const HEAD_R = 0.36;
const HEAD_LEN = 0.9;

function GizmoArrow({
  axis,
  color,
  onPointerDown,
}: {
  axis: 's' | 'lane';
  color: string;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  // S-axis: arrow points in +X (entity forward) → rotate Y-up cylinder to X
  // Lane-axis: arrow points in +Y (entity left) → keep Y-up cylinder
  const rotation: [number, number, number] =
    axis === 's' ? [0, 0, -Math.PI / 2] : [0, 0, 0];

  return (
    <group rotation={rotation}>
      <mesh position={[0, ARROW_LEN / 2, 0]} onPointerDown={onPointerDown}>
        <cylinderGeometry args={[SHAFT_R, SHAFT_R, ARROW_LEN, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
      </mesh>
      <mesh position={[0, ARROW_LEN + HEAD_LEN / 2, 0]} onPointerDown={onPointerDown}>
        <coneGeometry args={[HEAD_R, HEAD_LEN, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
      </mesh>
    </group>
  );
}

export const RoadGizmo: React.FC<RoadGizmoProps> = ({
  entityRef,
  openDriveDocument,
  currentRoadPosition,
  orbitControlsRef,
  onDragEnd,
}) => {
  const { camera, gl } = useThree();
  const dragRef = useRef<DragState | null>(null);
  const raycaster = useRef(new THREE.Raycaster());

  // Keep latest values in refs to avoid stale closures in DOM event handlers
  const propsRef = useRef({
    entityRef,
    openDriveDocument,
    orbitControlsRef,
    onDragEnd,
    camera,
  });
  propsRef.current = {
    entityRef,
    openDriveDocument,
    orbitControlsRef,
    onDragEnd,
    camera,
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      const { entityRef: eRef, openDriveDocument: odr, camera: cam } = propsRef.current;
      if (!drag || !eRef.current || !odr) return;

      // Convert mouse to NDC
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      // Raycast to horizontal drag plane
      raycaster.current.setFromCamera(mouse, cam);
      const intersection = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(drag.plane, intersection)) return;

      // Convert Three.js world → OpenDRIVE world
      // Rotation group Rx(-π/2): Three.js (x, y, z) ← OpenDRIVE (x, z, -y)
      // Inverse: OpenDRIVE (x, y) = Three.js (x, -z)
      const odrX = intersection.x;
      const odrY = -intersection.z;

      if (drag.axis === 's') {
        // S-axis drag: keep lane, update s
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
        // Lane-axis drag: keep s, update lane
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
    },
    [gl],
  );

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    const { entityRef: eRef, orbitControlsRef: oRef, onDragEnd: onEnd } = propsRef.current;

    // Re-enable orbit controls
    if (oRef?.current) oRef.current.enabled = true;

    // Remove DOM listeners
    gl.domElement.removeEventListener('pointermove', handlePointerMove);
    gl.domElement.removeEventListener('pointerup', handlePointerUp);

    // Notify parent with final position
    if (drag && eRef.current) {
      onEnd?.(
        eRef.current.position.x,
        eRef.current.position.y,
        eRef.current.position.z,
        eRef.current.rotation.z,
      );
    }

    dragRef.current = null;
  }, [gl, handlePointerMove]);

  const startDragImpl = useCallback(
    (axis: 's' | 'lane', event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();

      const { entityRef: eRef, orbitControlsRef: oRef } = propsRef.current;
      if (!eRef.current) return;

      // Get entity world position for drag plane
      const worldPos = new THREE.Vector3();
      eRef.current.getWorldPosition(worldPos);

      // Horizontal drag plane at entity's world height (Three.js Y = elevation)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

      dragRef.current = {
        axis,
        roadId: currentRoadPosition.roadId,
        laneId: currentRoadPosition.laneId,
        s: currentRoadPosition.s,
        plane,
      };

      // Disable orbit controls
      if (oRef?.current) oRef.current.enabled = false;

      // Add DOM listeners for drag tracking
      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
    },
    [currentRoadPosition, gl, handlePointerMove, handlePointerUp],
  );

  const handleSPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => startDragImpl('s', e),
    [startDragImpl],
  );

  const handleLanePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => startDragImpl('lane', e),
    [startDragImpl],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      if (propsRef.current.orbitControlsRef?.current) {
        propsRef.current.orbitControlsRef.current.enabled = true;
      }
    };
  }, [gl, handlePointerMove, handlePointerUp]);

  return (
    <>
      <GizmoArrow axis="s" color="#ff4444" onPointerDown={handleSPointerDown} />
      <GizmoArrow axis="lane" color="#44ff44" onPointerDown={handleLanePointerDown} />
    </>
  );
};

RoadGizmo.displayName = 'RoadGizmo';
