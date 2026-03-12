/**
 * Handles road surface raycasting for hover detection and click placement.
 * Lives inside the R3F Canvas. Uses useFrame for throttled hover raycasting
 * and DOM-level pointer events for click detection (to avoid OrbitControls conflicts).
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import type { OpenDriveDocument } from '@osce/shared';
import { worldToLane } from '@osce/opendrive';
import type { HoverLaneInfo } from '../store/viewer-types.js';

/** Data returned when a position is picked in pick mode */
export interface PickedPositionData {
  worldX: number;
  worldY: number;
  worldZ: number;
  heading: number;
  roadId: string;
  laneId: number;
  s: number;
  offset: number;
  roadT: number;
}

interface RoadClickHandlerProps {
  /** Reference to the road network group for raycasting */
  roadGroupRef: React.RefObject<THREE.Group | null>;
  /** Whether hover detection is active (Place or Translate mode) */
  hoverActive: boolean;
  /** Whether click placement is active (Place mode only) */
  clickActive: boolean;
  /** Whether an entity is selected (required for placement) */
  hasSelectedEntity: boolean;
  /** OpenDRIVE document for lane lookup */
  openDriveDocument: OpenDriveDocument | null;
  /** Snap to lane center */
  snapToLane: boolean;
  /** Reverse heading direction */
  reverseDirection: boolean;
  /** Callback when road click placement occurs */
  onPlacement: (x: number, y: number, z: number, h: number, forceWorldPosition: boolean) => void;
  /** Callback to update hover lane info (throttled by this component) */
  onHoverLaneChange: (info: HoverLaneInfo | null) => void;
  /** Ref for imperative lane highlight (updated every frame, no re-renders) */
  highlightedLaneRef: React.MutableRefObject<{ roadId: string; laneId: number } | null>;
  /** Whether position pick mode is active (overrides normal click behavior) */
  pickModeActive?: boolean;
  /** Callback when a position is picked in pick mode */
  onPositionPicked?: (data: PickedPositionData) => void;
  /** Callback when pick mode is cancelled via Escape */
  onPositionPickCancel?: () => void;
}

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

export function RoadClickHandler({
  roadGroupRef,
  hoverActive,
  clickActive,
  hasSelectedEntity,
  openDriveDocument,
  snapToLane,
  reverseDirection,
  onPlacement,
  onHoverLaneChange,
  highlightedLaneRef,
  pickModeActive = false,
  onPositionPicked,
  onPositionPickCancel,
}: RoadClickHandlerProps) {
  const { camera, gl } = useThree();

  // Track pointer position (client coordinates — no getBoundingClientRect per event)
  const pointerClientRef = useRef({ x: 0, y: 0 });
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const lastHoverUpdateRef = useRef(0);
  const lastHoverInfoRef = useRef<{ roadId: string; laneId: number } | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerMove = (e: PointerEvent) => {
      pointerClientRef.current.x = e.clientX;
      pointerClientRef.current.y = e.clientY;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gl]);

  // Hover raycasting (throttled to every 3 frames)
  useFrame(() => {
    if (!hoverActive || !roadGroupRef.current || !openDriveDocument) {
      // Clear highlight when inactive
      if (highlightedLaneRef.current !== null) {
        highlightedLaneRef.current = null;
        onHoverLaneChange(null);
      }
      return;
    }

    // Throttle: every 3 frames
    lastHoverUpdateRef.current++;
    if (lastHoverUpdateRef.current % 3 !== 0) return;

    // Get fresh rect every hover frame to avoid stale-rect drift on distant roads
    const rect = gl.domElement.getBoundingClientRect();
    const px = pointerClientRef.current.x - rect.left;
    const py = pointerClientRef.current.y - rect.top;

    // Convert to NDC
    pointerNdc.x = (px / rect.width) * 2 - 1;
    pointerNdc.y = -(py / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);

    const intersects = raycaster.intersectObjects(roadGroupRef.current.children, true);

    // Filter to only mesh intersections (skip labels, lines, etc.)
    const meshHit = intersects.find(
      (hit) => hit.object instanceof THREE.Mesh && hit.object.geometry instanceof THREE.BufferGeometry,
    );

    if (!meshHit) {
      if (highlightedLaneRef.current !== null) {
        highlightedLaneRef.current = null;
        onHoverLaneChange(null);
        lastHoverInfoRef.current = null;
      }
      return;
    }

    // Convert hit point to OpenDRIVE coordinates (inside the rotation group)
    const localPoint = roadGroupRef.current.worldToLocal(meshHit.point.clone());
    const osceX = localPoint.x;
    const osceY = localPoint.y;

    const laneResult = worldToLane(openDriveDocument, osceX, osceY, 20, reverseDirection);
    if (!laneResult) {
      if (highlightedLaneRef.current !== null) {
        highlightedLaneRef.current = null;
        onHoverLaneChange(null);
        lastHoverInfoRef.current = null;
      }
      return;
    }

    // Update highlight ref imperatively (no re-render)
    const prev = lastHoverInfoRef.current;
    if (!prev || prev.roadId !== laneResult.roadId || prev.laneId !== laneResult.laneId) {
      highlightedLaneRef.current = { roadId: laneResult.roadId, laneId: laneResult.laneId };
      lastHoverInfoRef.current = { roadId: laneResult.roadId, laneId: laneResult.laneId };
    }

    // Throttle store updates to ~100ms (every ~6 frames at 60fps)
    if (lastHoverUpdateRef.current % 6 === 0) {
      onHoverLaneChange({
        roadId: laneResult.roadId,
        laneId: laneResult.laneId,
        s: laneResult.s,
        offset: laneResult.offset,
        heading: laneResult.heading,
        worldX: osceX,
        worldY: osceY,
        worldZ: laneResult.z,
        roadT: laneResult.roadT,
      });
    }

  });

  // Click detection via DOM events (avoids conflicts with OrbitControls)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return; // left click only
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!roadGroupRef.current || !openDriveDocument) return;

      // In pick mode, skip entity selection requirement
      if (!pickModeActive && (!clickActive || !hasSelectedEntity)) return;

      // Click vs drag heuristic: 5px threshold
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (dx * dx + dy * dy > 25) return; // was a drag, not a click

      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const intersects = raycaster.intersectObjects(roadGroupRef.current.children, true);

      const meshHit = intersects.find(
        (hit) => hit.object instanceof THREE.Mesh && hit.object.geometry instanceof THREE.BufferGeometry,
      );

      if (!meshHit) return; // Only allow placement on road surfaces

      const localPoint = roadGroupRef.current.worldToLocal(meshHit.point.clone());
      const osceX = localPoint.x;
      const osceY = localPoint.y;
      const osceZ = localPoint.z;

      const laneResult = worldToLane(openDriveDocument, osceX, osceY, 20, reverseDirection);
      if (!laneResult) return; // No lane found nearby

      // Pick mode: return full coordinate data
      if (pickModeActive && onPositionPicked) {
        onPositionPicked({
          worldX: osceX,
          worldY: osceY,
          worldZ: osceZ,
          heading: laneResult.heading,
          roadId: laneResult.roadId,
          laneId: laneResult.laneId,
          s: laneResult.s,
          offset: laneResult.offset,
          roadT: laneResult.roadT,
        });
        return;
      }

      if (snapToLane) {
        // Snap ON: use lane coordinates, let EditorLayout convert to LanePosition
        onPlacement(osceX, osceY, osceZ, laneResult.heading, false);
      } else {
        // Snap OFF: use raw road surface point as WorldPosition
        onPlacement(osceX, osceY, osceZ, laneResult.heading, true);
      }
    },
    [clickActive, hasSelectedEntity, roadGroupRef, openDriveDocument, snapToLane, reverseDirection, onPlacement, gl, camera, pickModeActive, onPositionPicked],
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

  // Pick mode: crosshair cursor
  useEffect(() => {
    if (!pickModeActive) return;
    const canvas = gl.domElement;
    const prev = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    return () => {
      canvas.style.cursor = prev;
    };
  }, [pickModeActive, gl]);

  // Pick mode: Escape to cancel
  useEffect(() => {
    if (!pickModeActive || !onPositionPickCancel) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onPositionPickCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pickModeActive, onPositionPickCancel]);

  // This component renders nothing — it's purely behavioral
  return null;
}
