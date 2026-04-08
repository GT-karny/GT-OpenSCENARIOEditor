/**
 * Drag gizmo for trajectory points (vertices and control points).
 * Orange-themed version of WaypointGizmo.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToLane } from '@osce/opendrive';
import { roadCoordsToWorld } from '../utils/road-projection.js';

interface TrajectoryPointGizmoProps {
  position: [number, number, number];
  openDriveDocument: OpenDriveDocument | null;
  orbitControlsRef?: React.RefObject<any>;
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

interface DragState {
  plane: THREE.Plane;
  result: {
    x: number;
    y: number;
    z: number;
    h: number;
    roadId: string;
    laneId: number;
    s: number;
    offset: number;
    snapped: boolean;
  } | null;
}

export const TrajectoryPointGizmo: React.FC<TrajectoryPointGizmoProps> = React.memo(
  ({ position, openDriveDocument, orbitControlsRef, snapToLane = true, onDragEnd }) => {
    const { camera, gl } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const dragRef = useRef<DragState | null>(null);
    const raycaster = useRef(new THREE.Raycaster());

    const propsRef = useRef({
      openDriveDocument,
      orbitControlsRef,
      onDragEnd,
      camera,
      snapToLane,
    });
    propsRef.current = {
      openDriveDocument,
      orbitControlsRef,
      onDragEnd,
      camera,
      snapToLane,
    };

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        const drag = dragRef.current;
        const { openDriveDocument: odr, camera: cam } = propsRef.current;
        if (!drag || !groupRef.current || !odr) return;

        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );

        raycaster.current.setFromCamera(mouse, cam);
        const intersection = new THREE.Vector3();
        if (!raycaster.current.ray.intersectPlane(drag.plane, intersection)) return;

        // Three.js → OpenDRIVE: odrX = x, odrY = -z
        const odrX = intersection.x;
        const odrY = -intersection.z;

        if (propsRef.current.snapToLane) {
          const laneResult = worldToLane(odr, odrX, odrY, 30);
          if (laneResult) {
            const projected = roadCoordsToWorld(odr, laneResult.roadId, laneResult.laneId, laneResult.s);
            if (projected) {
              groupRef.current.position.set(projected.x, projected.y, projected.z);
              drag.result = {
                x: projected.x,
                y: projected.y,
                z: projected.z,
                h: projected.h,
                roadId: laneResult.roadId,
                laneId: laneResult.laneId,
                s: projected.s,
                offset: laneResult.offset ?? 0,
                snapped: true,
              };
            }
          }
        } else {
          // Free placement — use XY freely but snap height to road surface
          // odrX/odrY are OpenDRIVE coords; find road elevation at that point
          let odrZ = 0;
          if (odr) {
            const laneResult = worldToLane(odr, odrX, odrY, 30);
            if (laneResult) {
              const projected = roadCoordsToWorld(odr, laneResult.roadId, laneResult.laneId, laneResult.s);
              if (projected) {
                odrZ = projected.z; // OpenDRIVE Z = elevation
              }
            }
          }
          // Set position in OpenDRIVE local coords (gizmo is inside rotation group)
          groupRef.current.position.set(odrX, odrY, odrZ);
          drag.result = {
            x: odrX,
            y: odrY,
            z: odrZ,
            h: 0,
            roadId: '',
            laneId: 0,
            s: 0,
            offset: 0,
            snapped: false,
          };
        }
      },
      [gl],
    );

    const handlePointerUp = useCallback(() => {
      const drag = dragRef.current;
      const { orbitControlsRef: oRef, onDragEnd: onEnd } = propsRef.current;

      if (oRef?.current) oRef.current.enabled = true;

      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);

      if (drag?.result) {
        const r = drag.result;
        onEnd?.(r.x, r.y, r.z, r.h, r.roadId, String(r.laneId), r.s, r.offset, r.snapped);
      }

      dragRef.current = null;
    }, [gl, handlePointerMove]);

    const handleStartDrag = useCallback(
      (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (!groupRef.current) return;

        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldPos.y);

        dragRef.current = { plane, result: null };

        if (propsRef.current.orbitControlsRef?.current) {
          propsRef.current.orbitControlsRef.current.enabled = false;
        }

        gl.domElement.addEventListener('pointermove', handlePointerMove);
        gl.domElement.addEventListener('pointerup', handlePointerUp);
      },
      [gl, handlePointerMove, handlePointerUp],
    );

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
      <group ref={groupRef} position={position}>
        {/* Visible torus ring (selection indicator) - orange themed */}
        <mesh raycast={() => null}>
          <torusGeometry args={[1.0, 0.2, 12, 32]} />
          <meshBasicMaterial
            color="#FFAA00"
            transparent
            opacity={0.6}
            depthTest={false}
          />
        </mesh>
        {/* Invisible larger torus for easier click/drag hit detection */}
        <mesh onPointerDown={handleStartDrag} visible={false}>
          <torusGeometry args={[1.0, 0.5, 12, 32]} />
          <meshBasicMaterial />
        </mesh>
      </group>
    );
  },
);

TrajectoryPointGizmo.displayName = 'TrajectoryPointGizmo';
