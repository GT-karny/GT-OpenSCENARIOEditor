/**
 * Camera follow hook: smoothly tracks a target entity's position.
 * Supports third-person (orbit target follows entity) and top-down (camera follows entity) modes.
 * Manual camera rotation/zoom remains functional during follow.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SimulationFrame } from '@osce/shared';
import type { FollowMode } from '../store/viewer-types.js';

interface CameraFollowOptions {
  /** Entity name to follow (null = disabled) */
  targetEntity: string | null;
  /** Follow mode */
  followMode: FollowMode;
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
}

/**
 * Resolve entity position from either simulation frame or init positions.
 * Returns position in the rotated coordinate frame (inside the [-π/2, 0, 0] group).
 */
function resolveEntityWorldPosition(
  entityName: string,
  entityPositions: Map<string, WorldCoords>,
  currentFrame?: SimulationFrame | null,
): THREE.Vector3 | null {
  if (currentFrame) {
    // Simulation mode: get from frame data
    const obj = currentFrame.objects.find((o) => o.name === entityName);
    if (obj) {
      // Simulation coords need same transform as EntityGroup: rotation [-π/2, 0, 0]
      // In the rotated frame: Three.js (x, z, -y) ← OSCE (x, y, z)
      return new THREE.Vector3(obj.x, obj.z, -obj.y);
    }
  }

  // Init mode: get from resolved positions
  const pos = entityPositions.get(entityName);
  if (pos) {
    // Same transform: the rotation group maps OSCE coords to Three.js world
    return new THREE.Vector3(pos.x, pos.z, -pos.y);
  }

  return null;
}

export function useCameraFollow({
  targetEntity,
  followMode,
  orbitControlsRef,
  entityPositions,
  currentFrame,
  smoothness = 0.08,
  isFlyModeActive = false,
}: CameraFollowOptions) {
  const prevTargetPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(() => {
    if (!targetEntity || !orbitControlsRef?.current || isFlyModeActive) {
      initialized.current = false;
      return;
    }

    const controls = orbitControlsRef.current;
    const targetPos = resolveEntityWorldPosition(targetEntity, entityPositions, currentFrame);
    if (!targetPos) return;

    if (!initialized.current) {
      // First frame — snap to target position
      controls.target.copy(targetPos);
      prevTargetPos.current.copy(targetPos);
      initialized.current = true;
      controls.update();
      return;
    }

    // Smooth interpolation toward target
    const currentTarget = controls.target as THREE.Vector3;
    currentTarget.lerp(targetPos, smoothness);

    if (followMode === 'topDown') {
      // In top-down mode, also move camera X/Z to follow (keep Y fixed)
      const camera = controls.object;
      const dx = targetPos.x - prevTargetPos.current.x;
      const dz = targetPos.z - prevTargetPos.current.z;
      camera.position.x += dx * smoothness;
      camera.position.z += dz * smoothness;
    }
    // In third-person mode, only the target moves — camera offset maintained by OrbitControls

    prevTargetPos.current.copy(targetPos);
    controls.update();
  });
}
