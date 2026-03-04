/**
 * Camera controls: OrbitControls with top-down view toggle, entity focus,
 * and FPS-style fly controls on right-click.
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CameraMode } from '../store/viewer-types.js';
import { useFlyControls } from './useFlyControls.js';

interface CameraControllerProps {
  mode: CameraMode;
  focusTarget?: [number, number, number] | null;
  /** Fly controls speed multiplier (1.0 = default) */
  flySpeed?: number;
}

export interface CameraControllerHandle {
  /** Reference to the underlying OrbitControls */
  orbitControls: React.RefObject<any>;
}

export const CameraController = forwardRef<CameraControllerHandle, CameraControllerProps>(
  ({ mode, focusTarget, flySpeed = 1 }, ref) => {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

    // Expose OrbitControls ref to parent
    useImperativeHandle(ref, () => ({
      orbitControls: controlsRef,
    }), []);

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

    // Handle entity focus (double-click)
    useEffect(() => {
      if (!focusTarget || !controlsRef.current) return;
      const controls = controlsRef.current;
      const [x, y, z] = focusTarget;

      controls.target.set(x, y, z);

      if (mode === 'topDown') {
        camera.position.set(x, 200, z);
      } else {
        camera.position.set(x - 20, 15, z + 20);
      }
      camera.lookAt(x, y, z);
      controls.update();
    }, [focusTarget, mode, camera]);

    return (
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={1000}
        maxPolarAngle={Math.PI / 2 - 0.01}
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
