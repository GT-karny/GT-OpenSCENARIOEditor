/**
 * Camera controls: OrbitControls with top-down view toggle and entity focus.
 */

import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { CameraMode } from '../store/viewer-types.js';

interface CameraControllerProps {
  mode: CameraMode;
  focusTarget?: [number, number, number] | null;
}

export const CameraController: React.FC<CameraControllerProps> = React.memo(
  ({ mode, focusTarget }) => {
    const controlsRef = useRef<any>(null);
    const { camera } = useThree();

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

      // Set target to entity position
      controls.target.set(x, y, z);

      // Move camera to a good viewing position
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
      />
    );
  },
);

CameraController.displayName = 'CameraController';
