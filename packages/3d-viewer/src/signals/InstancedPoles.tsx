/**
 * Renders all signal poles as a single InstancedMesh for minimal draw calls.
 * Uses a unit-height cylinder scaled per instance to match each pole's height.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ResolvedSignal } from './TrafficSignalGroup.js';
import {
  POLE_RADIUS,
  POLE_COLOR,
  DEFAULT_SIGNAL_HEIGHT,
} from '../utils/signal-geometry.js';
import { getSharedStandardMaterial } from '../utils/shared-materials.js';

interface InstancedPolesProps {
  signals: ResolvedSignal[];
}

// Unit cylinder (height=1, Y-aligned) shared across all instances.
const UNIT_CYLINDER = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, 1, 8);

// Reusable quaternion for composing rotations.
const _qSignal = new THREE.Quaternion();
const _qCylToZ = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);

export const InstancedPoles: React.FC<InstancedPolesProps> = React.memo(({ signals }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(
    () => getSharedStandardMaterial({ color: POLE_COLOR, roughness: 0.8 }),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || signals.length === 0) return;

    const dummy = new THREE.Object3D();
    const euler = new THREE.Euler();

    for (let i = 0; i < signals.length; i++) {
      const { signal, position } = signals[i];
      const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
      const poleHeight = signalHeight;

      // The pole extends from z=0 to z=poleHeight (relative to signal base group)
      // Signal base group is positioned at z = position.z - signalHeight in world.
      // Pole center is at z = poleHeight / 2 relative to base.

      // The original TrafficSignalEntity applies:
      //   group position = [x, y, z - signalHeight]
      //   group rotation = [pitch, roll, h]
      //   pole mesh position = [0, 0, poleHeight/2], rotation = [PI/2, 0, 0]
      //
      // In instanced rendering we must compose these transforms into one matrix.

      // 1. Signal-level rotation (OpenDRIVE heading, pitch, roll)
      euler.set(position.pitch ?? 0, position.roll ?? 0, position.h);
      _qSignal.setFromEuler(euler);

      // 2. Local pole offset in signal-local frame: [0, 0, poleHeight/2]
      const localOffset = new THREE.Vector3(0, 0, poleHeight / 2);
      localOffset.applyQuaternion(_qSignal);

      dummy.position.set(
        position.x + localOffset.x,
        position.y + localOffset.y,
        (position.z - signalHeight) + localOffset.z,
      );

      // 3. Rotation: signal rotation * cylinder-to-Z rotation
      dummy.quaternion.copy(_qSignal).multiply(_qCylToZ);

      // 4. Scale Y to pole height (cylinder is unit-height, Y-aligned)
      dummy.scale.set(1, poleHeight, 1);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [signals]);

  if (signals.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[UNIT_CYLINDER, material, signals.length]}
      frustumCulled={false}
    />
  );
});

InstancedPoles.displayName = 'InstancedPoles';
