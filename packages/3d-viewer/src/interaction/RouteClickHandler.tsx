/**
 * Handles click events on road surfaces during route editing mode.
 * Raycasts against road meshes and converts world coordinates to
 * OpenDRIVE lane positions for waypoint placement.
 *
 * Mirrors RoadClickHandler's coordinate conversion and click detection pattern.
 */

import { useEffect, useRef, useCallback } from 'react';
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
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const onWaypointAddRef = useRef(onWaypointAdd);
  onWaypointAddRef.current = onWaypointAdd;

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!roadGroupRef.current || !openDriveDocument) return;

      // Click vs drag heuristic: 5px threshold
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (dx * dx + dy * dy > 25) return;

      // Fresh raycast at click position
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
      // After worldToLocal, coordinates are in the road group's local space
      // which IS the OpenDRIVE coordinate system (x=east, y=north, z=up)
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
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, handlePointerDown, handlePointerUp]);

  return null;
}
