/**
 * Renders all signal poles as a single InstancedMesh for minimal draw calls.
 * Uses a unit-height cylinder scaled per instance to match each pole's height.
 *
 * Signals belonging to arm-type assemblies are rendered separately via ArmPole.
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
import { ArmPole } from './ArmPole.js';

/** Minimal assembly info needed for pole rendering. */
export interface PoleAssemblyInfo {
  assemblyId: string;
  poleType: 'straight' | 'arm';
  armLength?: number;
  armAngle?: number;
  signalIds: string[];
}

interface InstancedPolesProps {
  signals: ResolvedSignal[];
  /** Map from signalId to assembly info. Only needed when assemblies exist. */
  assemblyMap?: Map<string, PoleAssemblyInfo>;
}

// Unit cylinder (height=1, Y-aligned) shared across all instances.
const UNIT_CYLINDER = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, 1, 8);

// Reusable quaternion for composing rotations.
const _qSignal = new THREE.Quaternion();
const _qCylToZ = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);

export const InstancedPoles: React.FC<InstancedPolesProps> = React.memo(
  ({ signals, assemblyMap }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const material = useMemo(
      () => getSharedStandardMaterial({ color: POLE_COLOR, roughness: 0.8 }),
      [],
    );

    // Split signals into straight (instanced) and arm (individual) poles.
    // For arm assemblies, only the first signal in each assembly gets the pole.
    const { straightSignals, armSignals } = useMemo(() => {
      const straight: ResolvedSignal[] = [];
      const arm: { rs: ResolvedSignal; assembly: PoleAssemblyInfo }[] = [];
      const seenArmAssemblies = new Set<string>();

      for (const rs of signals) {
        const assembly = assemblyMap?.get(rs.signal.id);
        if (assembly && assembly.poleType === 'arm') {
          // Only render one pole per arm assembly (the first signal we encounter)
          if (!seenArmAssemblies.has(assembly.assemblyId)) {
            seenArmAssemblies.add(assembly.assemblyId);
            arm.push({ rs, assembly });
          }
          // Skip this signal from instanced rendering (pole handled by ArmPole)
        } else {
          // For straight assemblies, only render one pole per assembly
          if (assembly && assembly.poleType === 'straight') {
            if (seenArmAssemblies.has(assembly.assemblyId)) continue;
            seenArmAssemblies.add(assembly.assemblyId);
          }
          straight.push(rs);
        }
      }

      return { straightSignals: straight, armSignals: arm };
    }, [signals, assemblyMap]);

    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh || straightSignals.length === 0) return;

      const dummy = new THREE.Object3D();
      const euler = new THREE.Euler();

      for (let i = 0; i < straightSignals.length; i++) {
        const { signal, position } = straightSignals[i];
        const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
        const poleHeight = signalHeight;

        euler.set(position.pitch ?? 0, position.roll ?? 0, position.h);
        _qSignal.setFromEuler(euler);

        const localOffset = new THREE.Vector3(0, 0, poleHeight / 2);
        localOffset.applyQuaternion(_qSignal);

        dummy.position.set(
          position.x + localOffset.x,
          position.y + localOffset.y,
          position.z - signalHeight + localOffset.z,
        );

        dummy.quaternion.copy(_qSignal).multiply(_qCylToZ);
        dummy.scale.set(1, poleHeight, 1);

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }, [straightSignals]);

    return (
      <>
        {straightSignals.length > 0 && (
          <instancedMesh
            ref={meshRef}
            args={[UNIT_CYLINDER, material, straightSignals.length]}
            frustumCulled={false}
          />
        )}
        {armSignals.map(({ rs, assembly }) => (
          <ArmPole
            key={rs.key}
            signal={rs}
            armLength={assembly.armLength ?? 3}
            armAngle={assembly.armAngle ?? 0}
          />
        ))}
      </>
    );
  },
);

InstancedPoles.displayName = 'InstancedPoles';
