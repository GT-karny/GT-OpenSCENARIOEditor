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
import type { PoleAssemblyInfo } from './InstancedPoles.js';
import type { SignalDescriptor } from '../utils/signal-catalog.js';
import { DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { getSharedBox } from '../utils/shared-geometries.js';
import { buildCacheKey, getSignalMaterials } from '../utils/signal-texture.js';
import { hasFlashingBulb, suppressFlashing } from '../utils/parse-traffic-light-state.js';
import { useFlashingClock } from '../hooks/useFlashingClock.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InstancedTrafficLightsProps {
  signals: ResolvedSignal[];
  stateMap: Map<string, string>;
  selectedKey?: string | null;
  assemblyMap?: Map<string, PoleAssemblyInfo>;
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
  ({ signals, stateMap, assemblyMap }) => {
    // Detect whether any signal has a flashing bulb to enable the clock
    const anyFlashing = useMemo(() => {
      for (const [, state] of stateMap) {
        if (hasFlashingBulb(state)) return true;
      }
      return false;
    }, [stateMap]);

    // Flashing clock: toggles at 1 Hz (only ticks when flashing signals exist)
    const flashOn = useFlashingClock(anyFlashing);

    // Build entries with resolved descriptors
    const entries = useMemo(() => {
      const result: TrafficLightEntry[] = [];
      for (const rs of signals) {
        const descriptor = resolveSignalDescriptor(rs.signal);
        if (!descriptor) continue;
        let activeState = stateMap.get(rs.signal.id);
        // During off-phase, replace "flashing" → "off" so the bulb goes dark
        if (activeState && !flashOn) {
          activeState = suppressFlashing(activeState);
        }
        result.push({ rs, descriptor, activeState });
      }
      return result;
    }, [signals, stateMap, flashOn]);

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
          <TrafficLightGroup key={group.key} group={group} assemblyMap={assemblyMap} />
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
  assemblyMap?: Map<string, PoleAssemblyInfo>;
}

// Reusable objects for matrix computation
const _qSignal = new THREE.Quaternion();
const _qHeadRot = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI / 2,
);
/** Additional 90° rotation around local Z-axis to lay housing sideways for horizontal signals */
const _qHoriz = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  Math.PI / 2,
);

const TrafficLightGroup: React.FC<TrafficLightGroupProps> = React.memo(
  ({ group, assemblyMap }) => {
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

        // For arm-mounted signals, center the housing on the arm (no headHeight/2 offset).
        // For straight poles, the housing bottom sits on top of the pole.
        const isArm = assemblyMap?.get(signal.id)?.poleType === 'arm';
        const zHead = isArm ? poleHeight : poleHeight + headHeight / 2;
        const localOffset = new THREE.Vector3(0, 0, zHead);
        localOffset.applyQuaternion(_qSignal);

        dummy.position.set(
          position.x + localOffset.x,
          position.y + localOffset.y,
          (position.z - signalHeight) + localOffset.z,
        );

        // Rotation: signal rotation * head rotation (PI/2 around Y)
        // For horizontal signals, add 90° around local Z to lay housing sideways
        dummy.quaternion.copy(_qSignal).multiply(_qHeadRot);
        if (descriptor.orientation === 'horizontal') {
          dummy.quaternion.multiply(_qHoriz);
        }
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();

      // Store signal keys in userData for manual raycast lookup by SignalHoverHandler
      mesh.userData.signalKeys = entries.map((e) => e.rs.key);
    }, [entries, descriptor, assemblyMap]);

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
