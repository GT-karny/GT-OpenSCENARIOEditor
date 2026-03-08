/**
 * Handles click events on road surfaces during route editing mode.
 * Raycasts against road meshes and converts world coordinates to
 * OpenDRIVE lane positions for waypoint placement.
 *
 * Mirrors RoadClickHandler's coordinate conversion and click detection pattern.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToLane } from '@osce/opendrive';

interface RouteClickHandlerProps {
  roadGroupRef: React.RefObject<THREE.Group | null>;
  openDriveDocument: OpenDriveDocument | null;
  onWaypointAdd: (
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

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

export function RouteClickHandler({
  roadGroupRef,
  openDriveDocument,
  onWaypointAdd,
}: RouteClickHandlerProps) {
  const { camera, gl } = useThree();
  const onWaypointAddRef = useRef(onWaypointAdd);
  onWaypointAddRef.current = onWaypointAdd;

  const handleDblClick = useCallback(
    (e: MouseEvent) => {
      if (!roadGroupRef.current || !openDriveDocument) return;

      // Raycast at double-click position
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const intersects = raycaster.intersectObjects(roadGroupRef.current.children, true);

      const meshHit = intersects.find(
        (hit) =>
          hit.object instanceof THREE.Mesh &&
          hit.object.geometry instanceof THREE.BufferGeometry,
      );
      if (!meshHit) return;

      // Convert hit point to OpenDRIVE local coords
      const localPt = roadGroupRef.current.worldToLocal(meshHit.point.clone());
      const osceX = localPt.x;
      const osceY = localPt.y;
      const osceZ = localPt.z;

      const lane = worldToLane(openDriveDocument, osceX, osceY, 20, false);
      if (!lane) return;

      onWaypointAddRef.current(
        osceX,
        osceY,
        osceZ,
        lane.heading,
        lane.roadId,
        String(lane.laneId),
        lane.s,
        lane.offset,
      );
    },
    [roadGroupRef, openDriveDocument, gl, camera],
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('dblclick', handleDblClick);
    return () => {
      canvas.removeEventListener('dblclick', handleDblClick);
    };
  }, [gl, handleDblClick]);

  return null;
}
