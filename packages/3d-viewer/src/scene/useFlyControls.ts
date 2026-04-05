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

// Reusable objects — avoid per-frame allocations that cause GC pressure
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

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

  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;

    // Re-enable orbit controls
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;

      // Sync OrbitControls target to where the camera is looking
      camera.getWorldDirection(_forward);
      orbitControlsRef.current.target.copy(camera.position).addScaledVector(_forward, 30);
      orbitControlsRef.current.update();
    }

    document.removeEventListener('mousemove', handleMouseMove);
  }, [camera, orbitControlsRef, handleMouseMove]);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 2) return;
      deactivate();
    },
    [deactivate],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  const handleBlur = useCallback(() => {
    keysRef.current.clear();
    deactivate();
  }, [deactivate]);

  // Attach listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    // Listen on document so pointerup outside the canvas is caught
    document.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Reset all input state when window loses focus (tab switch, minimize, etc.)
    window.addEventListener('blur', handleBlur);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handlePointerDown, handlePointerUp, handleContextMenu, handleKeyDown, handleKeyUp, handleBlur, handleMouseMove]);

  // Per-frame update
  useFrame((_, delta) => {
    if (!isActiveRef.current) return;

    const keys = keysRef.current;
    const speed = moveSpeed * delta * (keys.has('shift') ? sprintMultiplier : 1);

    // Apply mouse look (yaw/pitch)
    const dx = mouseDeltaRef.current.x;
    const dy = mouseDeltaRef.current.y;
    mouseDeltaRef.current.x = 0;
    mouseDeltaRef.current.y = 0;

    eulerRef.current.y -= dx * lookSensitivity;
    eulerRef.current.x -= dy * lookSensitivity;
    // Clamp pitch to avoid flipping
    eulerRef.current.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, eulerRef.current.x));

    camera.quaternion.setFromEuler(eulerRef.current);

    // Movement vectors (reuse module-level objects to avoid GC pressure)
    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();

    _right.crossVectors(_forward, _up).normalize();

    // WASD movement
    if (keys.has('w')) camera.position.addScaledVector(_forward, speed);
    if (keys.has('s')) camera.position.addScaledVector(_forward, -speed);
    if (keys.has('a')) camera.position.addScaledVector(_right, -speed);
    if (keys.has('d')) camera.position.addScaledVector(_right, speed);

    // E/Q vertical movement
    if (keys.has('e')) camera.position.y += speed;
    if (keys.has('q')) camera.position.y -= speed;
  });

  return { isActive: isActiveRef };
}
