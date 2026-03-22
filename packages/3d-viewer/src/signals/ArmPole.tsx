/**
 * Renders a single arm-type signal pole: a vertical pole with a horizontal arm.
 * Used for signals in assemblies with poleType === 'arm'.
 * Cannot be instanced since each arm has different geometry.
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

    // Signal-level euler for orientation
    const { position } = signal;

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Vertical pole: center at half height, rotated to align with Z axis */}
        <mesh
          geometry={verticalGeo}
          material={material}
          position={[0, 0, poleHeight / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />

        {/* Horizontal arm at top of pole, extending at armAngle */}
        <group position={[0, 0, poleHeight]} rotation={[0, 0, armAngle]}>
          <mesh
            geometry={armGeo}
            material={material}
            position={[armLength / 2, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          />
        </group>
      </group>
    );
  },
);

ArmPole.displayName = 'ArmPole';
