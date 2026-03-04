/**
 * FPS-style camera controls activated by holding right mouse button.
 * WASD = forward/left/backward/right, E/Q = up/down, mouse = look.
 * Disables OrbitControls while active.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FlyControlsOptions {
  /** Reference to OrbitControls to disable during fly mode */
  orbitControlsRef: React.RefObject<any>;
  /** Movement speed (units per second) */
  moveSpeed?: number;
  /** Mouse look sensitivity */
  lookSensitivity?: number;
  /** Speed multiplier when Shift is held */
  sprintMultiplier?: number;
}

export function useFlyControls({
  orbitControlsRef,
  moveSpeed = 20,
  lookSensitivity = 0.003,
  sprintMultiplier = 3,
}: FlyControlsOptions) {
  const { camera, gl } = useThree();

  const isActiveRef = useRef(false);
  const keysRef = useRef(new Set<string>());
  const mouseDeltaRef = useRef({ x: 0, y: 0 });
  // Euler for yaw/pitch tracking
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActiveRef.current) return;
    mouseDeltaRef.current.x += e.movementX;
    mouseDeltaRef.current.y += e.movementY;
  }, []);

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 2) return; // right click only
      isActiveRef.current = true;
      mouseDeltaRef.current = { x: 0, y: 0 };

      // Initialize euler from current camera orientation
      eulerRef.current.setFromQuaternion(camera.quaternion, 'YXZ');

      // Disable orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }

      document.addEventListener('mousemove', handleMouseMove);
    },
    [camera, orbitControlsRef, handleMouseMove],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 2) return;
      isActiveRef.current = false;

      // Re-enable orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;

        // Sync OrbitControls target to where the camera is looking
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const target = camera.position.clone().add(dir.multiplyScalar(30));
        orbitControlsRef.current.target.copy(target);
        orbitControlsRef.current.update();
      }

      document.removeEventListener('mousemove', handleMouseMove);
    },
    [camera, orbitControlsRef, handleMouseMove],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // Attach listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handlePointerDown, handlePointerUp, handleContextMenu, handleKeyDown, handleKeyUp, handleMouseMove]);

  // Per-frame update
  useFrame((_, delta) => {
    if (!isActiveRef.current) return;

    const keys = keysRef.current;
    const speed = moveSpeed * delta * (keys.has('shift') ? sprintMultiplier : 1);

    // Apply mouse look (yaw/pitch)
    const dx = mouseDeltaRef.current.x;
    const dy = mouseDeltaRef.current.y;
    mouseDeltaRef.current = { x: 0, y: 0 };

    eulerRef.current.y -= dx * lookSensitivity;
    eulerRef.current.x -= dy * lookSensitivity;
    // Clamp pitch to avoid flipping
    eulerRef.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, eulerRef.current.x));

    camera.quaternion.setFromEuler(eulerRef.current);

    // Movement vectors
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // WASD movement
    if (keys.has('w')) camera.position.addScaledVector(forward, speed);
    if (keys.has('s')) camera.position.addScaledVector(forward, -speed);
    if (keys.has('a')) camera.position.addScaledVector(right, -speed);
    if (keys.has('d')) camera.position.addScaledVector(right, speed);

    // E/Q vertical movement
    if (keys.has('e')) camera.position.y += speed;
    if (keys.has('q')) camera.position.y -= speed;
  });

  return { isActive: isActiveRef };
}
