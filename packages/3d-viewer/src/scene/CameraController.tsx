/**
 * Camera controls: OrbitControls with top-down view toggle, entity focus,
 * and FPS-style fly controls on right-click.
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CameraMode } from '../store/viewer-types.js';
import { useFlyControls } from './useFlyControls.js';

interface CameraControllerProps {
  mode: CameraMode;
  focusTarget?: [number, number, number] | null;
  /** Fly controls speed multiplier (1.0 = default) */
  flySpeed?: number;
  /** Ref to write camera state into each frame (for minimap) */
  cameraStateRef?: React.RefObject<{ position: THREE.Vector3; target: THREE.Vector3 }>;
}

export interface CameraControllerHandle {
  /** Reference to the underlying OrbitControls */
  orbitControls: React.RefObject<any>;
}

interface CameraAnimation {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  elapsed: number;
  duration: number;
  active: boolean;
}

/** Smooth interpolation: ease-in-out */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

const FOCUS_DURATION = 0.3; // seconds

export const CameraController = forwardRef<CameraControllerHandle, CameraControllerProps>(
  ({ mode, focusTarget, flySpeed = 1, cameraStateRef }, ref) => {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();
    const animRef = useRef<CameraAnimation>({
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
      elapsed: 0,
      duration: FOCUS_DURATION,
      active: false,
    });
    // Track whether the animation loop is driving the update (vs user interaction)
    const animDrivingUpdateRef = useRef(false);

    // Expose OrbitControls ref to parent
    useImperativeHandle(ref, () => ({
      orbitControls: controlsRef,
    }), []);

    // Cancel animation on user interaction with OrbitControls
    // (but ignore changes driven by the animation loop itself)
    const handleControlsChange = useCallback(() => {
      if (animRef.current.active && !animDrivingUpdateRef.current) {
        animRef.current.active = false;
      }
    }, []);

    // FPS fly controls (right-click + WASD/EQ) — base speed × multiplier
    useFlyControls({ orbitControlsRef: controlsRef, moveSpeed: 20 * flySpeed });

    // Handle camera mode changes
    useEffect(() => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;

      if (mode === 'topDown') {
        const target = controls.target;
        camera.position.set(target.x, 200, target.z);
        camera.lookAt(target.x, 0, target.z);
        controls.enableRotate = false;
        controls.update();
      } else {
        controls.enableRotate = true;
      }
    }, [mode, camera]);

    // Handle entity focus — start smooth animation
    useEffect(() => {
      if (!focusTarget || !controlsRef.current) return;
      const controls = controlsRef.current;
      const [x, y, z] = focusTarget;

      const anim = animRef.current;
      anim.startPos.copy(camera.position);
      anim.startTarget.copy(controls.target);
      anim.endTarget.set(x, y, z);

      if (mode === 'topDown') {
        anim.endPos.set(x, 200, z);
      } else {
        anim.endPos.set(x - 20, 15, z + 20);
      }

      anim.elapsed = 0;
      anim.duration = FOCUS_DURATION;
      anim.active = true;
    }, [focusTarget, mode, camera]);

    // Animate camera each frame
    useFrame((_, delta) => {
      // Write camera state for minimap (always, regardless of animation)
      if (cameraStateRef?.current && controlsRef.current) {
        cameraStateRef.current.position.copy(camera.position);
        cameraStateRef.current.target.copy(controlsRef.current.target);
      }

      const anim = animRef.current;
      if (!anim.active) return;

      const controls = controlsRef.current;
      if (!controls) return;

      anim.elapsed += delta;
      const raw = Math.min(anim.elapsed / anim.duration, 1);
      const t = smoothstep(raw);

      controls.target.lerpVectors(anim.startTarget, anim.endTarget, t);
      camera.position.lerpVectors(anim.startPos, anim.endPos, t);

      // Flag to prevent onChange from cancelling the animation
      animDrivingUpdateRef.current = true;
      controls.update();
      animDrivingUpdateRef.current = false;

      if (raw >= 1) {
        anim.active = false;
      }
    });

    return (
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2 - 0.01}
        onChange={handleControlsChange}
        mouseButtons={{
          LEFT: undefined as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: undefined as unknown as THREE.MOUSE,
        }}
      />
    );
  },
);

CameraController.displayName = 'CameraController';
