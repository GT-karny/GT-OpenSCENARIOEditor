/**
 * Renders a single arm-type signal pole: a vertical pole with a horizontal arm.
 * Used for signals in assemblies with poleType === 'arm'.
 *
 * The signal position is at the HEAD (over the lane) where the housing renders.
 * The pole base is offset from the signal position by armLength in the opposite
 * direction of armAngle.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ResolvedSignal } from './TrafficSignalGroup.js';
import {
  POLE_RADIUS,
  POLE_COLOR,
  DEFAULT_SIGNAL_HEIGHT,
} from '../utils/signal-geometry.js';
import { getSharedStandardMaterial } from '../utils/shared-materials.js';

interface ArmPoleProps {
  signal: ResolvedSignal;
  armLength: number;
  armAngle: number;
}

const ARM_SEGMENTS = 8;

export const ArmPole: React.FC<ArmPoleProps> = React.memo(
  ({ signal, armLength, armAngle }) => {
    const material = useMemo(
      () => getSharedStandardMaterial({ color: POLE_COLOR, roughness: 0.8 }),
      [],
    );

    const signalHeight = signal.signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;

    // Vertical pole geometry (from ground to arm height)
    const verticalGeo = useMemo(
      () => new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, poleHeight, ARM_SEGMENTS),
      [poleHeight],
    );

    // Horizontal arm geometry
    const armGeo = useMemo(
      () => new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, armLength, ARM_SEGMENTS),
      [armLength],
    );

    // Signal position is at the HEAD (lane center). Pole base is offset by -armLength.
    const { position } = signal;

    // Pole base in world XY: offset from head position opposite to armAngle
    const poleBaseX = position.x - armLength * Math.cos(armAngle);
    const poleBaseY = position.y - armLength * Math.sin(armAngle);
    const poleBaseZ = position.z - signalHeight;

    // Arm midpoint (halfway between pole top and head)
    const armMidX = (poleBaseX + position.x) / 2;
    const armMidY = (poleBaseY + position.y) / 2;

    return (
      <group>
        {/* Vertical pole at pole base, CylinderGeometry is Y-aligned → rotate to Z-up */}
        <mesh
          geometry={verticalGeo}
          material={material}
          position={[poleBaseX, poleBaseY, poleBaseZ + poleHeight / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        {/* Horizontal arm from pole top to head position */}
        <mesh
          geometry={armGeo}
          material={material}
          position={[armMidX, armMidY, position.z]}
          rotation={[0, 0, armAngle + Math.PI / 2]}
        />
      </group>
    );
  },
);

ArmPole.displayName = 'ArmPole';
