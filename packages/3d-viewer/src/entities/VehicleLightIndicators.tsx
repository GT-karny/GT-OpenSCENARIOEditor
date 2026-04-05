/**
 * Renders turn indicator triangles (◁ ▷) on vehicle sides.
 * Left triangle points left, right triangle points right.
 * Only rendered when the corresponding indicator is on or flashing.
 */

import React from 'react';
import * as THREE from 'three';
import type { VehicleLightState } from '../scenario/useEntityLightStates.js';
import { useFlashingClock } from '../hooks/useFlashingClock.js';

interface VehicleLightIndicatorsProps {
  vehicleWidth: number;
  centerX: number;
  centerZ: number;
  lightState: VehicleLightState;
}

// Triangle size
const TRI_WIDTH = 1.0; // width in Y direction (how far it sticks out)
const TRI_HEIGHT = 0.8; // height in Z direction

// Offset from vehicle body edge
const SIDE_OFFSET = 0.3;

// Shared geometries (created once, reused across all instances)
const leftTriGeo = /* @__PURE__ */ (() => {
  const geo = new THREE.BufferGeometry();
  // Triangle in YZ plane, tip pointing +Y (left/outward)
  const vertices = new Float32Array([
    0, TRI_WIDTH, 0, // tip (pointing outward)
    0, 0, -TRI_HEIGHT / 2, // base bottom
    0, 0, TRI_HEIGHT / 2, // base top
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
})();

const rightTriGeo = /* @__PURE__ */ (() => {
  const geo = new THREE.BufferGeometry();
  // Triangle in YZ plane, tip pointing -Y (right/outward)
  const vertices = new Float32Array([
    0, -TRI_WIDTH, 0, // tip (pointing outward)
    0, 0, -TRI_HEIGHT / 2, // base bottom
    0, 0, TRI_HEIGHT / 2, // base top
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
})();

// Shared material (orange, additive blending, unlit)
const indicatorMaterial = /* @__PURE__ */ new THREE.MeshBasicMaterial({
  color: '#FF8800',
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

export const VehicleLightIndicators: React.FC<VehicleLightIndicatorsProps> = React.memo(
  ({ vehicleWidth, centerX, centerZ, lightState }) => {
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

    return (
      <group>
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
      </group>
    );
  },
);

VehicleLightIndicators.displayName = 'VehicleLightIndicators';
