/**
 * Lane editing interaction handler.
 * Raycasts road meshes to detect hovered lane, provides click/context-menu callbacks.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

export interface LaneHoverInfo {
  roadId: string;
  sectionIdx: number;
  laneId: number;
  s: number;
  side: 'left' | 'right';
  screenX: number;
  screenY: number;
  worldPoint: THREE.Vector3;
}

interface LaneEditInteractionProps {
  active: boolean;
  openDriveDocument: OpenDriveDocument;
  activeRoadId: string | null;
  roadGroupRef: React.RefObject<THREE.Group | null>;
  onLaneHover?: (info: LaneHoverInfo | null) => void;
  onLaneClick?: (info: LaneHoverInfo) => void;
  onLaneContextMenu?: (info: LaneHoverInfo, screenX: number, screenY: number) => void;
  onRoadContextMenu?: (roadId: string, s: number, screenX: number, screenY: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

// Walk up the scene graph to find a parent with userData.roadId
function findRoadIdFromObject(obj: THREE.Object3D | null): string | null {
  let current = obj;
  while (current) {
    if (current.userData?.roadId) return current.userData.roadId as string;
    current = current.parent;
  }
  return null;
}

// Approximate s coordinate along road from a local point (inside rotation group)
function approximateS(road: OdrRoad, localX: number, localY: number): number {
  const geo = road.planView[0];
  if (!geo) return 0;

  const dx = localX - geo.x;
  const dy = localY - geo.y;

  // Project onto road heading direction
  const cosH = Math.cos(geo.hdg);
  const sinH = Math.sin(geo.hdg);
  const sApprox = dx * cosH + dy * sinH;

  return Math.max(0, Math.min(road.length, sApprox));
}

// Find section index at given s
function findSectionAtS(road: OdrRoad, s: number): number {
  for (let i = road.lanes.length - 1; i >= 0; i--) {
    if (s >= road.lanes[i].s) return i;
  }
  return 0;
}

// Determine side and approximate lane from lateral offset
function determineLane(
  road: OdrRoad,
  sectionIdx: number,
  localX: number,
  localY: number,
): { side: 'left' | 'right'; laneId: number } {
  const geo = road.planView[0];
  if (!geo) return { side: 'right', laneId: -1 };

  const dx = localX - geo.x;
  const dy = localY - geo.y;

  // Lateral offset (perpendicular to heading)
  const cosH = Math.cos(geo.hdg);
  const sinH = Math.sin(geo.hdg);
  const t = -dx * sinH + dy * cosH;

  const section = road.lanes[sectionIdx];
  if (!section) return { side: t >= 0 ? 'left' : 'right', laneId: t >= 0 ? 1 : -1 };

  // t > 0 = left side, t < 0 = right side in OpenDRIVE
  if (t >= 0) {
    const laneIdx = Math.min(
      Math.floor(t / 3.5),
      Math.max(section.leftLanes.length - 1, 0),
    );
    const lane = section.leftLanes[laneIdx];
    return { side: 'left', laneId: lane?.id ?? 1 };
  } else {
    const laneIdx = Math.min(
      Math.floor(-t / 3.5),
      Math.max(section.rightLanes.length - 1, 0),
    );
    const lane = section.rightLanes[laneIdx];
    return { side: 'right', laneId: lane?.id ?? -1 };
  }
}

export function LaneEditInteraction({
  active,
  openDriveDocument,
  activeRoadId,
  roadGroupRef,
  onLaneHover,
  onLaneClick,
  onLaneContextMenu,
  onRoadContextMenu,
  orbitControlsRef,
}: LaneEditInteractionProps) {
  const { camera, gl } = useThree();

  const pointerClientRef = useRef({ x: 0, y: 0 });
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const rectRef = useRef<DOMRect | null>(null);
  const frameCountRef = useRef(0);
  const lastHoverRef = useRef<LaneHoverInfo | null>(null);

  // Keep active in a ref to avoid stale closures in DOM listeners
  const activeRef = useRef(active);
  activeRef.current = active;

  // Cache canvas rect
  useEffect(() => {
    const canvas = gl.domElement;
    rectRef.current = canvas.getBoundingClientRect();

    const handleResize = () => {
      rectRef.current = canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gl]);

  // Track pointer position passively
  useEffect(() => {
    const canvas = gl.domElement;
    const handlePointerMove = (e: PointerEvent) => {
      pointerClientRef.current.x = e.clientX;
      pointerClientRef.current.y = e.clientY;
    };
    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => canvas.removeEventListener('pointermove', handlePointerMove);
  }, [gl]);

  // Build hover info from a raycast hit
  const buildHoverInfo = useCallback(
    (
      meshHit: THREE.Intersection,
      screenX: number,
      screenY: number,
    ): LaneHoverInfo | null => {
      const roadId = findRoadIdFromObject(meshHit.object);
      if (!roadId) return null;

      // If activeRoadId is set, only consider that road
      if (activeRoadId && roadId !== activeRoadId) return null;

      const road = openDriveDocument.roads.find((r) => r.id === roadId);
      if (!road) return null;

      // Convert hit point to local coords inside the road group
      const localPoint = roadGroupRef.current
        ? roadGroupRef.current.worldToLocal(meshHit.point.clone())
        : meshHit.point.clone();

      // In OpenDRIVE rotation group: localPoint.x = odrX, localPoint.y = odrY
      const odrX = localPoint.x;
      const odrY = localPoint.y;

      const s = approximateS(road, odrX, odrY);
      const sectionIdx = findSectionAtS(road, s);
      const { side, laneId } = determineLane(road, sectionIdx, odrX, odrY);

      return {
        roadId,
        sectionIdx,
        laneId,
        s,
        side,
        screenX,
        screenY,
        worldPoint: meshHit.point.clone(),
      };
    },
    [openDriveDocument, activeRoadId, roadGroupRef],
  );

  // Perform a raycast and return the first mesh hit
  const performRaycast = useCallback(
    (clientX: number, clientY: number): THREE.Intersection | null => {
      if (!roadGroupRef.current) return null;

      const rect = rectRef.current;
      if (!rect) return null;

      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const intersects = raycaster.intersectObjects(roadGroupRef.current.children, true);

      return (
        intersects.find(
          (hit) =>
            hit.object instanceof THREE.Mesh &&
            hit.object.geometry instanceof THREE.BufferGeometry,
        ) ?? null
      );
    },
    [roadGroupRef, camera],
  );

  // Hover raycasting throttled to every 3 frames
  useFrame(() => {
    if (!active || !roadGroupRef.current) {
      if (lastHoverRef.current !== null) {
        lastHoverRef.current = null;
        onLaneHover?.(null);
      }
      return;
    }

    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return;

    const hit = performRaycast(pointerClientRef.current.x, pointerClientRef.current.y);
    if (!hit) {
      if (lastHoverRef.current !== null) {
        lastHoverRef.current = null;
        onLaneHover?.(null);
      }
      return;
    }

    const info = buildHoverInfo(
      hit,
      pointerClientRef.current.x,
      pointerClientRef.current.y,
    );

    // Only notify if the hover target changed
    const prev = lastHoverRef.current;
    if (
      info?.roadId !== prev?.roadId ||
      info?.laneId !== prev?.laneId ||
      info?.sectionIdx !== prev?.sectionIdx
    ) {
      lastHoverRef.current = info;
      onLaneHover?.(info);
    }
  });

  // Click detection via DOM events (avoids OrbitControls conflicts)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0 || !activeRef.current) return;

      // Click vs drag heuristic: 5px threshold
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (dx * dx + dy * dy > 25) return;

      const hit = performRaycast(e.clientX, e.clientY);
      if (!hit) return;

      const info = buildHoverInfo(hit, e.clientX, e.clientY);
      if (info) {
        onLaneClick?.(info);
      }
    },
    [performRaycast, buildHoverInfo, onLaneClick],
  );

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      if (!activeRef.current) return;

      const hit = performRaycast(e.clientX, e.clientY);
      if (!hit) return;

      e.preventDefault();

      const info = buildHoverInfo(hit, e.clientX, e.clientY);
      if (info) {
        onLaneContextMenu?.(info, e.clientX, e.clientY);
      } else {
        // Hit road surface but no specific lane identified
        const roadId = findRoadIdFromObject(hit.object);
        if (roadId) {
          const road = openDriveDocument.roads.find((r) => r.id === roadId);
          if (road) {
            const localPoint = roadGroupRef.current
              ? roadGroupRef.current.worldToLocal(hit.point.clone())
              : hit.point.clone();
            const s = approximateS(road, localPoint.x, localPoint.y);
            onRoadContextMenu?.(roadId, s, e.clientX, e.clientY);
          }
        }
      }
    },
    [
      performRaycast,
      buildHoverInfo,
      onLaneContextMenu,
      onRoadContextMenu,
      openDriveDocument,
      roadGroupRef,
    ],
  );

  // Register DOM event listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, handlePointerDown, handlePointerUp, handleContextMenu]);

  // Clear hover when component deactivates
  useEffect(() => {
    if (!active && lastHoverRef.current !== null) {
      lastHoverRef.current = null;
      onLaneHover?.(null);
    }
  }, [active, onLaneHover]);

  // Suppress unused variable warning for orbitControlsRef (reserved for future drag interactions)
  void orbitControlsRef;

  // Purely behavioral component — renders nothing
  return null;
}
