/**
 * Renders vehicle light effects: turn indicators, headlights, high beam, and brake lights.
 * Each light consists of:
 *   1. A core emissive plane (the "bulb")
 *   2. A sprite-based radial glow (soft bloom)
 *   3. A pointLight to illuminate the surrounding scene
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { VehicleLightState } from '../scenario/useEntityLightStates.js';
import { useFlashingClock } from '../hooks/useFlashingClock.js';

interface VehicleLightEffectsProps {
  vehicleWidth: number;
  vehicleLength: number;
  centerX: number;
  centerZ: number;
  lightState: VehicleLightState;
}

// --- Procedural radial glow texture (generated once) ---

function createGlowTexture(size = 64): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const glowTexture = /* @__PURE__ */ createGlowTexture();

// --- Indicator triangles ---

const TRI_WIDTH = 1.0;
const TRI_HEIGHT = 0.8;
const SIDE_OFFSET = 0.3;

const leftTriGeo = /* @__PURE__ */ (() => {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, TRI_WIDTH, 0,
    0, 0, -TRI_HEIGHT / 2,
    0, 0, TRI_HEIGHT / 2,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
})();

const rightTriGeo = /* @__PURE__  */ (() => {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, -TRI_WIDTH, 0,
    0, 0, -TRI_HEIGHT / 2,
    0, 0, TRI_HEIGHT / 2,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
})();

const indicatorMaterial = /* @__PURE__ */ new THREE.MeshBasicMaterial({
  color: '#FF8800',
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// --- Light core geometry ---

const LIGHT_W = 0.3;
const LIGHT_H = 0.2;
const lightGeo = /* @__PURE__ */ new THREE.PlaneGeometry(LIGHT_W, LIGHT_H);

// --- Light config per type ---

interface LightConfig {
  color: string;
  coreOpacity: number;
  glowColor: string;
  glowSize: number; // sprite scale
  glowOpacity: number;
  intensity: number; // pointLight intensity
  distance: number; // pointLight distance
}

const HEADLIGHT_CONFIG: LightConfig = {
  color: '#FFFDE0',
  coreOpacity: 0.9,
  glowColor: '#FFF8C0',
  glowSize: 2.0,
  glowOpacity: 0.35,
  intensity: 3,
  distance: 15,
};

const HIGH_BEAM_CONFIG: LightConfig = {
  color: '#E8F0FF',
  coreOpacity: 0.95,
  glowColor: '#D0E0FF',
  glowSize: 3.0,
  glowOpacity: 0.5,
  intensity: 6,
  distance: 25,
};

const BRAKE_CONFIG: LightConfig = {
  color: '#FF2200',
  coreOpacity: 0.9,
  glowColor: '#FF4400',
  glowSize: 1.8,
  glowOpacity: 0.4,
  intensity: 2,
  distance: 8,
};

/** Creates a SpriteMaterial for radial glow */
function useGlowMaterial(color: string, opacity: number): THREE.SpriteMaterial {
  return useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, opacity],
  );
}

/** Creates a MeshBasicMaterial for the light core */
function useCoreMaterial(color: string, opacity: number): THREE.MeshBasicMaterial {
  return useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color, opacity],
  );
}

/** Single light unit: core plane + sprite glow + pointLight */
const LightUnit: React.FC<{
  position: [number, number, number];
  rotY: number;
  config: LightConfig;
}> = React.memo(({ position, rotY, config }) => {
  const coreMat = useCoreMaterial(config.color, config.coreOpacity);
  const glowMat = useGlowMaterial(config.glowColor, config.glowOpacity);

  return (
    <group position={position}>
      {/* Core emissive plane */}
      <mesh geometry={lightGeo} material={coreMat} rotation={[0, rotY, 0]} />
      {/* Sprite glow — always faces camera, natural soft bloom */}
      <sprite material={glowMat} scale={[config.glowSize, config.glowSize, 1]} />
      {/* Scene illumination */}
      <pointLight
        color={config.color}
        intensity={config.intensity}
        distance={config.distance}
        decay={2}
      />
    </group>
  );
});
LightUnit.displayName = 'LightUnit';

/** A pair of lights (left/right) at the front or rear of the vehicle */
const LightPair: React.FC<{
  xPos: number;
  halfWidth: number;
  centerZ: number;
  config: LightConfig;
  faceFront: boolean;
}> = React.memo(({ xPos, halfWidth, centerZ, config, faceFront }) => {
  const rotY = faceFront ? Math.PI / 2 : -Math.PI / 2;
  const inset = 0.15;
  return (
    <>
      <LightUnit
        position={[xPos, halfWidth - inset, centerZ]}
        rotY={rotY}
        config={config}
      />
      <LightUnit
        position={[xPos, -(halfWidth - inset), centerZ]}
        rotY={rotY}
        config={config}
      />
    </>
  );
});
LightPair.displayName = 'LightPair';

export const VehicleLightEffects: React.FC<VehicleLightEffectsProps> = React.memo(
  ({ vehicleWidth, vehicleLength, centerX, centerZ, lightState }) => {
    const hasFlashing =
      lightState.indicatorLeft === 'flashing' || lightState.indicatorRight === 'flashing';
    const flashOn = useFlashingClock(hasFlashing);

    const showLeft = lightState.indicatorLeft != null;
    const showRight = lightState.indicatorRight != null;

    const leftVisible =
      lightState.indicatorLeft === 'on' || (lightState.indicatorLeft === 'flashing' && flashOn);
    const rightVisible =
      lightState.indicatorRight === 'on' || (lightState.indicatorRight === 'flashing' && flashOn);

    const halfWidth = vehicleWidth / 2;
    const frontX = centerX + vehicleLength / 2 + 0.02;
    const rearX = centerX - vehicleLength / 2 - 0.02;

    const showHeadlight = lightState.headLight && !lightState.highBeam;
    const showHighBeam = lightState.highBeam;
    const showBrake = lightState.brakeLight;

    return (
      <group>
        {/* Turn indicators */}
        {showLeft && (
          <mesh
            geometry={leftTriGeo}
            material={indicatorMaterial}
            position={[centerX, halfWidth + SIDE_OFFSET, centerZ]}
            visible={leftVisible}
          />
        )}
        {showRight && (
          <mesh
            geometry={rightTriGeo}
            material={indicatorMaterial}
            position={[centerX, -(halfWidth + SIDE_OFFSET), centerZ]}
            visible={rightVisible}
          />
        )}

        {/* Headlights (low beam) */}
        {showHeadlight && (
          <LightPair
            xPos={frontX}
            halfWidth={halfWidth}
            centerZ={centerZ}
            config={HEADLIGHT_CONFIG}
            faceFront
          />
        )}

        {/* High beam */}
        {showHighBeam && (
          <LightPair
            xPos={frontX}
            halfWidth={halfWidth}
            centerZ={centerZ}
            config={HIGH_BEAM_CONFIG}
            faceFront
          />
        )}

        {/* Brake lights */}
        {showBrake && (
          <LightPair
            xPos={rearX}
            halfWidth={halfWidth}
            centerZ={centerZ}
            config={BRAKE_CONFIG}
            faceFront={false}
          />
        )}
      </group>
    );
  },
);

VehicleLightEffects.displayName = 'VehicleLightEffects';
