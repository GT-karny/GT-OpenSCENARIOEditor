/**
 * Renders traffic light signal heads using InstancedMesh, grouped by visual key.
 * Signals with the same descriptor shape + activeState share one InstancedMesh.
 *
 * Hover/click detection is handled externally by SignalHoverHandler via manual
 * raycasting. Signal keys are stored in mesh.userData.signalKeys for lookup.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ResolvedSignal } from './TrafficSignalGroup.js';
import type { SignalDescriptor } from '../utils/signal-catalog.js';
import { DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { getSharedBox } from '../utils/shared-geometries.js';
import { buildCacheKey, getSignalMaterials } from '../utils/signal-texture.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InstancedTrafficLightsProps {
  signals: ResolvedSignal[];
  stateMap: Map<string, string>;
  selectedKey?: string | null;
}

interface TrafficLightEntry {
  rs: ResolvedSignal;
  descriptor: SignalDescriptor;
  activeState: string | undefined;
}

interface TextureGroup {
  key: string;
  descriptor: SignalDescriptor;
  activeState: string | undefined;
  entries: TrafficLightEntry[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InstancedTrafficLights: React.FC<InstancedTrafficLightsProps> = React.memo(
  ({ signals, stateMap }) => {
    // Build entries with resolved descriptors
    const entries = useMemo(() => {
      const result: TrafficLightEntry[] = [];
      for (const rs of signals) {
        const descriptor = resolveSignalDescriptor(rs.signal);
        if (!descriptor) continue;
        const activeState = stateMap.get(rs.signal.id);
        result.push({ rs, descriptor, activeState });
      }
      return result;
    }, [signals, stateMap]);

    // Group entries by texture cache key
    const groups = useMemo(() => {
      const map = new Map<string, TextureGroup>();
      for (const entry of entries) {
        const key = buildCacheKey(entry.descriptor, entry.activeState);
        let group = map.get(key);
        if (!group) {
          group = {
            key,
            descriptor: entry.descriptor,
            activeState: entry.activeState,
            entries: [],
          };
          map.set(key, group);
        }
        group.entries.push(entry);
      }
      return [...map.values()];
    }, [entries]);

    return (
      <>
        {groups.map((group) => (
          <TrafficLightGroup key={group.key} group={group} />
        ))}
      </>
    );
  },
);

InstancedTrafficLights.displayName = 'InstancedTrafficLights';

// ---------------------------------------------------------------------------
// Per-group InstancedMesh
// ---------------------------------------------------------------------------

interface TrafficLightGroupProps {
  group: TextureGroup;
}

// Reusable objects for matrix computation
const _qSignal = new THREE.Quaternion();
const _qHeadRot = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI / 2,
);

const TrafficLightGroup: React.FC<TrafficLightGroupProps> = React.memo(
  ({ group }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { descriptor, activeState, entries } = group;
    const { housing } = descriptor;

    const boxGeo = useMemo(
      () => getSharedBox(housing.height, housing.width, housing.depth),
      [housing.width, housing.height, housing.depth],
    );

    const materials = useMemo(
      () => getSignalMaterials(descriptor, activeState),
      [descriptor, activeState],
    );

    // Update instance matrices
    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh || entries.length === 0) return;

      const dummy = new THREE.Object3D();
      const euler = new THREE.Euler();
      const headHeight = descriptor.housing.height;

      for (let i = 0; i < entries.length; i++) {
        const { rs } = entries[i];
        const { signal, position } = rs;
        const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
        const poleHeight = signalHeight;

        // The original layout:
        //   base group: position=[x, y, z-signalHeight], rotation=[pitch, roll, h]
        //   head group: position=[0, 0, poleHeight]
        //   inner group: position=[0, 0, headHeight/2]
        //   mesh: rotation=[0, PI/2, 0]

        euler.set(position.pitch ?? 0, position.roll ?? 0, position.h);
        _qSignal.setFromEuler(euler);

        // Local offset in signal frame: [0, 0, poleHeight + headHeight/2]
        const localOffset = new THREE.Vector3(0, 0, poleHeight + headHeight / 2);
        localOffset.applyQuaternion(_qSignal);

        dummy.position.set(
          position.x + localOffset.x,
          position.y + localOffset.y,
          (position.z - signalHeight) + localOffset.z,
        );

        // Rotation: signal rotation * head rotation (PI/2 around Y)
        dummy.quaternion.copy(_qSignal).multiply(_qHeadRot);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();

      // Store signal keys in userData for manual raycast lookup by SignalHoverHandler
      mesh.userData.signalKeys = entries.map((e) => e.rs.key);
    }, [entries, descriptor]);

    if (entries.length === 0) return null;

    return (
      <instancedMesh
        ref={meshRef}
        args={[boxGeo, undefined, entries.length]}
        material={materials}
        frustumCulled={false}
      />
    );
  },
);

TrafficLightGroup.displayName = 'TrafficLightGroup';
