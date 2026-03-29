/**
 * Shared drag-on-plane hook for gizmo components.
 *
 * Encapsulates the common pattern of:
 * 1. Pointer down → create drag plane, disable orbit controls, add DOM listeners
 * 2. Pointer move → raycast to plane, call onDragMove with intersection
 * 3. Pointer up → re-enable orbit controls, remove listeners, call onDragEnd
 * 4. Cleanup on unmount
 *
 * Used by RoadGizmo, SignalGizmo, WaypointGizmo.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

export interface UseDragOnPlaneOptions {
  /** Ref to OrbitControls (disabled during drag) */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
  /**
   * Create the drag plane when drag starts.
   * Called with the ThreeEvent from pointerDown.
   * Return null to cancel the drag.
   */
  createPlane: (e: ThreeEvent<PointerEvent>) => THREE.Plane | null;
  /**
   * Optional: transform the raycaster ray into local space before plane intersection.
   * Useful when the gizmo is inside a rotation group.
   * Return the inverse world matrix of the parent group.
   */
  getLocalSpaceMatrix?: () => THREE.Matrix4 | null;
  /** Called each frame during drag with the intersection point */
  onDragMove: (intersection: THREE.Vector3) => void;
  /** Called when drag ends */
  onDragEnd: () => void;
}

export function useDragOnPlane({
  orbitControlsRef,
  createPlane,
  getLocalSpaceMatrix,
  onDragMove,
  onDragEnd,
}: UseDragOnPlaneOptions) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const planeRef = useRef<THREE.Plane | null>(null);

  // Keep latest callbacks in refs to avoid stale closures in DOM event handlers
  const callbacksRef = useRef({ onDragMove, onDragEnd, orbitControlsRef, getLocalSpaceMatrix });
  callbacksRef.current = { onDragMove, onDragEnd, orbitControlsRef, getLocalSpaceMatrix };

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const plane = planeRef.current;
      if (!plane) return;

      // Convert mouse to NDC
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.current.setFromCamera(mouse, cameraRef.current);

      // Transform ray into local space if needed
      const localMatrix = callbacksRef.current.getLocalSpaceMatrix?.();
      if (localMatrix) {
        raycaster.current.ray.applyMatrix4(localMatrix);
      }

      const intersection = new THREE.Vector3();
      if (!raycaster.current.ray.intersectPlane(plane, intersection)) return;

      callbacksRef.current.onDragMove(intersection);
    },
    [gl],
  );

  const handlePointerUp = useCallback(() => {
    const oRef = callbacksRef.current.orbitControlsRef;

    // Re-enable orbit controls
    if (oRef?.current) oRef.current.enabled = true;

    // Remove DOM listeners
    gl.domElement.removeEventListener('pointermove', handlePointerMove);
    gl.domElement.removeEventListener('pointerup', handlePointerUp);

    callbacksRef.current.onDragEnd();
    planeRef.current = null;
  }, [gl, handlePointerMove]);

  const startDrag = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();

      const plane = createPlane(e);
      if (!plane) return;

      planeRef.current = plane;

      // Disable orbit controls
      const oRef = callbacksRef.current.orbitControlsRef;
      if (oRef?.current) oRef.current.enabled = false;

      // Add DOM listeners for drag tracking
      gl.domElement.addEventListener('pointermove', handlePointerMove);
      gl.domElement.addEventListener('pointerup', handlePointerUp);
    },
    [createPlane, gl, handlePointerMove, handlePointerUp],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerup', handlePointerUp);
      if (callbacksRef.current.orbitControlsRef?.current) {
        callbacksRef.current.orbitControlsRef.current.enabled = true;
      }
    };
  }, [gl, handlePointerMove, handlePointerUp]);

  return { startDrag };
}
