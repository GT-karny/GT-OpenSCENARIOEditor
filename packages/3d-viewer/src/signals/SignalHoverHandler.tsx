/**
 * Click-only raycaster for signal selection.
 *
 * Hover raycasting was removed for performance — with many signals the
 * per-frame InstancedMesh raycast was too expensive (up to 3ms spikes).
 * Click detection uses DOM pointer events and only raycasts on actual clicks.
 *
 * Signal keys are resolved from mesh.userData:
 * - InstancedMesh: userData.signalKeys[instanceId]
 * - Regular mesh/group: userData.signalKey (traverses up the parent chain)
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface SignalHoverHandlerProps {
  /** Ref to the <group> wrapping all signals (TrafficSignalGroup root) */
  signalGroupRef: React.RefObject<THREE.Group | null>;
  /** Callback for signal click */
  onSignalSelect?: (key: string) => void;
}

const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();

/** Resolve signal key from a raycast intersection hit. */
function resolveSignalKey(hit: THREE.Intersection): string | null {
  // Check InstancedMesh hit
  if (hit.object instanceof THREE.InstancedMesh && hit.instanceId != null) {
    const keys = hit.object.userData.signalKeys as string[] | undefined;
    if (keys?.[hit.instanceId]) return keys[hit.instanceId];
  }
  // Traverse up parents to find signalKey in userData
  let obj: THREE.Object3D | null = hit.object;
  while (obj) {
    if (obj.userData.signalKey) return obj.userData.signalKey as string;
    obj = obj.parent;
  }
  return null;
}

export function SignalHoverHandler({
  signalGroupRef,
  onSignalSelect,
}: SignalHoverHandlerProps) {
  const { camera, gl } = useThree();

  // Click handler via DOM events
  const pointerDownRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0 || !onSignalSelect || !signalGroupRef.current) return;
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (dx * dx + dy * dy > 25) return; // drag threshold

      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);

      const hits = _raycaster.intersectObject(signalGroupRef.current, true);
      for (const hit of hits) {
        const key = resolveSignalKey(hit);
        if (key) {
          onSignalSelect(key);
          return;
        }
      }
    },
    [gl, camera, signalGroupRef, onSignalSelect],
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
