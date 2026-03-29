/**
 * Scene environment: lights, fog, grid, cursor light.
 * Tuned to match the APEX dark-purple design identity.
 */

import React, { useRef } from 'react';
import { Environment, Grid } from '@react-three/drei';
import type { PointLight } from 'three';
import { Color, FogExp2, Plane, Raycaster, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { cursorWorldPos } from '../utils/apex-cursor.js';

/** APEX background: deep dark purple */
const BG_COLOR = new Color('#0e0a1f');
const FOG_COLOR = new Color('#0e0a1f');
const FOG_DENSITY = 0.004;

/** Apply fog + background once on mount */
function SceneFog() {
  const scene = useThree((s) => s.scene);
  React.useEffect(() => {
    scene.background = BG_COLOR;
    scene.fog = new FogExp2(FOG_COLOR, FOG_DENSITY);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

// Reusable objects — avoid allocations in the render loop
const _raycaster = new Raycaster();
const _groundPlane = new Plane(new Vector3(0, 1, 0), 0); // Y-up ground
const _intersection = new Vector3();

/** APEX cursor light — purple point light that follows the mouse on the ground plane */
function CursorLight3D() {
  const lightRef = useRef<PointLight>(null);
  const camera = useThree((s) => s.camera);
  const pointer = useThree((s) => s.pointer);

  useFrame(() => {
    if (!lightRef.current) return;

    // Cast ray from camera through mouse position onto Y=0 ground plane
    _raycaster.setFromCamera(pointer, camera);
    const hit = _raycaster.ray.intersectPlane(_groundPlane, _intersection);

    if (hit) {
      // Hover the light slightly above the ground
      lightRef.current.position.set(hit.x, 8, hit.z);
      // Share cursor world position for rim-glow materials
      cursorWorldPos.set(hit.x, 0, hit.z);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color="#9B84E8"
      intensity={15}
      distance={80}
      decay={2}
    />
  );
}

interface SceneEnvironmentProps {
  showGrid: boolean;
}

export const SceneEnvironment: React.FC<SceneEnvironmentProps> = React.memo(
  ({ showGrid }) => {
    return (
      <>
        <SceneFog />
        <CursorLight3D />

        {/* Minimal ambient to keep shadow areas visible */}
        <ambientLight intensity={0.12} color="#b8c8e8" />

        {/* Hemisphere: cool sky → warm-dark ground */}
        <hemisphereLight args={['#8899cc', '#2a2420', 0.35]} />

        {/* Key light — warm, from low angle (not directly above) */}
        <directionalLight
          position={[60, 40, 40]}
          intensity={0.7}
          color="#fff0e0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-bias={-0.0005}
        />

        {/* Fill light — cool purple-blue, opposite side */}
        <directionalLight position={[-40, 30, -20]} intensity={0.3} color="#9088cc" />

        {/* Rim light — faint edge highlight from behind */}
        <directionalLight position={[-10, 25, 50]} intensity={0.15} color="#aabbdd" />

        {/* Night environment for subtle metallic reflections */}
        <Environment preset="night" background={false} />

        {showGrid && (
          <Grid
            args={[1000, 1000]}
            cellSize={10}
            cellThickness={0.5}
            cellColor="#1a1530"
            sectionSize={50}
            sectionThickness={1}
            sectionColor="#2a2445"
            fadeDistance={500}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
        )}
      </>
    );
  },
);

SceneEnvironment.displayName = 'SceneEnvironment';
