/**
 * Camera follow hook: smoothly tracks a target entity's position during simulation.
 * Moves both camera position and orbit target to follow the entity.
 * Manual camera rotation/zoom remains functional during follow.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SimulationFrame } from '@osce/shared';

interface CameraFollowOptions {
  /** Entity name to follow (null = disabled) */
  targetEntity: string | null;
  /** Reference to OrbitControls */
  orbitControlsRef: React.RefObject<any>;
  /** Init entity positions (used when not simulating) */
  entityPositions: Map<string, WorldCoords>;
  /** Current simulation frame (used during playback) */
  currentFrame?: SimulationFrame | null;
  /** Smoothing factor (0-1, lower = smoother) */
  smoothness?: number;
  /** Whether FPS fly mode is currently active (pauses follow) */
  isFlyModeActive?: boolean;
  /** Whether simulation is currently running (follow only active during simulation) */
  isSimulating?: boolean;
}

/**
 * Resolve entity position from simulation frame.
 * Returns position in the rotated coordinate frame (inside the [-π/2, 0, 0] group).
 */
function resolveEntityWorldPosition(
  entityName: string,
  currentFrame: SimulationFrame,
): THREE.Vector3 | null {
  const obj = currentFrame.objects.find((o) => o.name === entityName);
  if (obj) {
    // Simulation coords: Three.js (x, z, -y) ← OSCE (x, y, z)
    return new THREE.Vector3(obj.x, obj.z, -obj.y);
  }
  return null;
}

export function useCameraFollow({
  targetEntity,
  orbitControlsRef,
  entityPositions: _entityPositions,
  currentFrame,
  smoothness = 0.08,
  isFlyModeActive = false,
  isSimulating = false,
}: CameraFollowOptions) {
  const prevTargetPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    // Only follow during simulation playback
    if (!targetEntity || !orbitControlsRef?.current || isFlyModeActive || !isSimulating || !currentFrame) {
      initialized.current = false;
      return;
    }

    const controls = orbitControlsRef.current;
    const targetPos = resolveEntityWorldPosition(targetEntity, currentFrame);
    if (!targetPos) return;

    if (!initialized.current) {
      // First frame — snap to target position, keep current camera offset
      const offset = new THREE.Vector3().subVectors(
        controls.object.position,
        controls.target,
      );
      controls.target.copy(targetPos);
      controls.object.position.copy(targetPos).add(offset);
      prevTargetPos.current.copy(targetPos);
      initialized.current = true;
      controls.update();
      return;
    }

    // Compute movement delta from previous frame
    const delta = new THREE.Vector3().subVectors(targetPos, prevTargetPos.current);

    // Apply smoothed delta to both target and camera position
    const smoothDelta = delta.clone().multiplyScalar(smoothness);
    controls.target.add(smoothDelta);
    controls.object.position.add(smoothDelta);

    prevTargetPos.current.lerp(targetPos, smoothness);
    controls.update();
  });
}
