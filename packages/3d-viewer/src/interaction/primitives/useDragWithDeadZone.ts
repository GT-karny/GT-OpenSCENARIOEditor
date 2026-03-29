/**
 * Shared drag hook with dead-zone threshold for road-editing gizmos.
 *
 * Encapsulates the common pattern of:
 * 1. Pointer down → record screen position, create drag plane
 * 2. Pointer move → check dead zone (9px²), raycast to plane, call onDragMove
 * 3. Pointer up → if dragged, call onDragEnd; re-enable orbit controls
 * 4. Cleanup on unmount
 *
 * Used by ControlPointGizmo, EndPointGizmo, TangentHandle, ArcCurvatureHandle.
 *
 * Unlike useDragOnPlane (which starts dragging immediately on pointerDown),
 * this hook requires the pointer to move past a dead zone before drag engages.
 * This prevents accidental drags on clicks.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULT_DEAD_ZONE = 9; // px² (3px threshold)

export interface UseDragWithDeadZoneOptions {
  /** Ref to OrbitControls (disabled during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  /** Create the drag plane. Return null to cancel. */
  createPlane: () => THREE.Plane | null;
  /**
   * Optional: transform the intersection from world space to local space.
   * Called with the intersection point after successful raycast.
   * Typically calls `parent.worldToLocal(intersection)`.
   */
  worldToLocal?: (intersection: THREE.Vector3) => void;
  /** Called each frame during drag with the intersection point in local space */
  onDragMove: (intersection: THREE.Vector3) => void;
  /** Called when drag ends (only if dead zone was crossed) */
  onDragEnd: () => void;
  /** Dead zone threshold in px². Default: 9 */
  deadZone?: number;
}

export function useDragWithDeadZone({
  orbitControlsRef,
  createPlane,
  worldToLocal,
  onDragMove,
  onDragEnd,
  deadZone = DEFAULT_DEAD_ZONE,
}: UseDragWithDeadZoneOptions) {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);
  const planeRef = useRef<THREE.Plane | null>(null);
  const startScreenRef = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());

  // Keep latest callbacks in refs to avoid stale closures
  const callbacksRef = useRef({ onDragMove, onDragEnd, orbitControlsRef, worldToLocal });
  callbacksRef.current = { onDragMove, onDragEnd, orbitControlsRef, worldToLocal };

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const activeMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpRef = useRef<((e: PointerEvent) => void) | null>(null);

  const handlePointerMove = useCallback(
    (ev: PointerEvent) => {
      const plane = planeRef.current;
      if (!plane) return;

      // Dead zone check
      const dx = ev.clientX - startScreenRef.current.x;
      const dy = ev.clientY - startScreenRef.current.y;
      if (!isDraggingRef.current && dx * dx + dy * dy > deadZone) {
        isDraggingRef.current = true;
        const oRef = callbacksRef.current.orbitControlsRef;
        if (oRef?.current) oRef.current.enabled = false;
      }

      if (!isDraggingRef.current) return;

      // NDC conversion
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );

      // Raycast to plane
      raycaster.current.setFromCamera(mouse, cameraRef.current);
      const intersection = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(plane, intersection)) return;

      // Convert to local space
      callbacksRef.current.worldToLocal?.(intersection);

      callbacksRef.current.onDragMove(intersection);
    },
    [gl, deadZone],
  );

  const handlePointerUp = useCallback(() => {
    const oRef = callbacksRef.current.orbitControlsRef;

    // Remove DOM listeners
    if (activeMoveRef.current) {
      gl.domElement.removeEventListener('pointermove', activeMoveRef.current);
      activeMoveRef.current = null;
    }
    if (activeUpRef.current) {
      gl.domElement.removeEventListener('pointerup', activeUpRef.current);
      activeUpRef.current = null;
    }

    // Re-enable orbit controls
    if (oRef?.current) oRef.current.enabled = true;

    // Call onDragEnd only if dead zone was crossed
    if (isDraggingRef.current) {
      callbacksRef.current.onDragEnd();
    }

    isDraggingRef.current = false;
    planeRef.current = null;
  }, [gl]);

  const startDrag = useCallback(
    (startScreenX: number, startScreenY: number) => {
      const plane = createPlane();
      if (!plane) return;

      isDraggingRef.current = false;
      planeRef.current = plane;
      startScreenRef.current = { x: startScreenX, y: startScreenY };

      // Store handler refs for cleanup
      activeMoveRef.current = handlePointerMove;
      activeUpRef.current = handlePointerUp;

      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
    },
    [createPlane, gl, handlePointerMove, handlePointerUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeMoveRef.current) {
        gl.domElement.removeEventListener('pointermove', activeMoveRef.current);
      }
      if (activeUpRef.current) {
        gl.domElement.removeEventListener('pointerup', activeUpRef.current);
      }
      if (callbacksRef.current.orbitControlsRef?.current) {
        callbacksRef.current.orbitControlsRef.current.enabled = true;
      }
    };
  }, [gl]);

  return { startDrag, isDragging: isDraggingRef };
}
