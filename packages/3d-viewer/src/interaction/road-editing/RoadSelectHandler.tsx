/**
 * Handles road mesh click selection in 3D viewer.
 * Raycasts against road meshes and identifies the roadId from parent group userData.
 * Supports cycle selection when multiple roads overlap at the click position.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface RoadSelectHandlerProps {
  /** Whether select mode is active */
  active: boolean;
  /** Ref to the road network group containing road meshes */
  roadGroupRef: React.RefObject<THREE.Group | null>;
  /** Callback when a road is selected */
  onRoadSelect: (roadId: string) => void;
  /** Callback when a road is hovered (null = no road under cursor) */
  onRoadHover?: (roadId: string | null) => void;
}

/** Walk up the scene graph to find the nearest parent with userData.roadId */
function findRoadIdFromObject(obj: THREE.Object3D | null): string | null {
  let current = obj;
  while (current) {
    if (current.userData?.roadId) {
      return current.userData.roadId as string;
    }
    current = current.parent;
  }
  return null;
}

export function RoadSelectHandler({
  active,
  roadGroupRef,
  onRoadSelect,
  onRoadHover,
}: RoadSelectHandlerProps) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Track last selected roadId for cycle selection
  const lastSelectedRef = useRef<string | null>(null);
  const lastClickPosRef = useRef<{ x: number; y: number } | null>(null);

  // Store latest callback in ref to avoid re-registering listeners
  const onRoadSelectRef = useRef(onRoadSelect);
  onRoadSelectRef.current = onRoadSelect;

  const onRoadHoverRef = useRef(onRoadHover);
  onRoadHoverRef.current = onRoadHover;

  const lastHoveredRef = useRef<string | null>(null);

  const roadGroupRefStable = useRef(roadGroupRef);
  roadGroupRefStable.current = roadGroupRef;

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  useEffect(() => {
    if (!active) return;

    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0 || !pointerDownPos.current) return;

      // Check if it was a click (not a drag)
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.hypot(dx, dy) > 5) {
        pointerDownPos.current = null;
        return;
      }
      pointerDownPos.current = null;

      const roadGroup = roadGroupRefStable.current.current;
      if (!roadGroup) return;

      // Compute normalized device coordinates
      const rect = domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      // Only intersect mesh objects within the road group
      const meshes: THREE.Object3D[] = [];
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
          meshes.push(child);
        }
      });

      const hits = raycaster.current.intersectObjects(meshes, false);
      if (hits.length === 0) return;

      // Collect unique roadIds from all hits
      const hitRoadIds: string[] = [];
      const seen = new Set<string>();
      for (const hit of hits) {
        const roadId = findRoadIdFromObject(hit.object);
        if (roadId && !seen.has(roadId)) {
          seen.add(roadId);
          hitRoadIds.push(roadId);
        }
      }

      if (hitRoadIds.length === 0) return;

      // Cycle selection: if clicking the same position, cycle to next road
      let selectedId: string;
      const isSamePos =
        lastClickPosRef.current &&
        Math.hypot(e.clientX - lastClickPosRef.current.x, e.clientY - lastClickPosRef.current.y) <
          10;

      if (isSamePos && lastSelectedRef.current && hitRoadIds.length > 1) {
        const currentIdx = hitRoadIds.indexOf(lastSelectedRef.current);
        const nextIdx = (currentIdx + 1) % hitRoadIds.length;
        selectedId = hitRoadIds[nextIdx];
      } else {
        selectedId = hitRoadIds[0];
      }

      lastSelectedRef.current = selectedId;
      lastClickPosRef.current = { x: e.clientX, y: e.clientY };
      onRoadSelectRef.current(selectedId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!onRoadHoverRef.current) return;
      const roadGroup = roadGroupRefStable.current.current;
      if (!roadGroup) return;

      const rect = domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      const meshes: THREE.Object3D[] = [];
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
          meshes.push(child);
        }
      });

      const hits = raycaster.current.intersectObjects(meshes, false);
      let hoveredId: string | null = null;
      for (const hit of hits) {
        const roadId = findRoadIdFromObject(hit.object);
        if (roadId) {
          hoveredId = roadId;
          break;
        }
      }

      if (hoveredId !== lastHoveredRef.current) {
        lastHoveredRef.current = hoveredId;
        onRoadHoverRef.current(hoveredId);
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointermove', handlePointerMove);
      // Clear hover on cleanup
      if (lastHoveredRef.current && onRoadHoverRef.current) {
        onRoadHoverRef.current(null);
        lastHoveredRef.current = null;
      }
    };
  }, [active, gl.domElement]);

  return null;
}
