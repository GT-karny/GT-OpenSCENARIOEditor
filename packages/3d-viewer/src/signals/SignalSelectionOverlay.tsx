/**
 * Renders selection/hover Outlines for a single traffic signal.
 * Overlaid on top of the InstancedMesh at the correct world position.
 * Only rendered for at most one signal (the selected or hovered one).
 *
 * The mesh itself is invisible — only the Outlines effect is shown.
 * Position computation mirrors InstancedTrafficLights for exact alignment.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import type { ResolvedSignal } from './TrafficSignalGroup.js';
import { SELECTION_COLORS, OUTLINE_THICKNESS } from '../constants/selection-theme.js';
import type { PoleAssemblyInfo } from './InstancedPoles.js';
import type { SignalDescriptor } from '../utils/signal-catalog.js';
import { DEFAULT_SIGNAL_HEIGHT, TRAFFIC_LIGHT } from '../utils/signal-geometry.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { getSharedBox } from '../utils/shared-geometries.js';

// Invisible material — we only want the Outlines effect
const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });

// Reusable quaternion objects (mirrors InstancedTrafficLights)
const _qSignal = new THREE.Quaternion();
const _qHeadRot = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  Math.PI / 2,
);
const _qHoriz = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  Math.PI / 2,
);

interface SignalSelectionOverlayProps {
  signal: ResolvedSignal;
  activeState?: string;
  isSelected: boolean;
  assemblyMap?: Map<string, PoleAssemblyInfo>;
}

export const SignalSelectionOverlay: React.FC<SignalSelectionOverlayProps> = React.memo(
  ({ signal: rs, isSelected, assemblyMap }) => {
    const { signal, position, category } = rs;
    const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;

    const descriptor = useMemo(
      () => (category === 'trafficLight' ? resolveSignalDescriptor(signal) : null),
      [signal, category],
    );

    const headHeight = descriptor
      ? descriptor.housing.height
      : category === 'trafficLight'
        ? TRAFFIC_LIGHT.housingHeight
        : 0;

    // Compute world position & quaternion matching InstancedTrafficLights exactly
    const { worldPos, worldQuat } = useMemo(() => {
      const euler = new THREE.Euler(position.pitch ?? 0, position.roll ?? 0, position.h);
      _qSignal.setFromEuler(euler);

      const isArm = assemblyMap?.get(signal.id)?.poleType === 'arm';
      const zHead = isArm ? poleHeight : poleHeight + headHeight / 2;
      const localOffset = new THREE.Vector3(0, 0, zHead);
      localOffset.applyQuaternion(_qSignal);

      const pos = new THREE.Vector3(
        position.x + localOffset.x,
        position.y + localOffset.y,
        (position.z - signalHeight) + localOffset.z,
      );

      const quat = new THREE.Quaternion().copy(_qSignal).multiply(_qHeadRot);
      if (descriptor?.orientation === 'horizontal') {
        quat.multiply(_qHoriz);
      }

      return { worldPos: pos, worldQuat: quat };
    }, [position, signal.id, signalHeight, poleHeight, headHeight, assemblyMap, descriptor]);

    if (category !== 'trafficLight' || !descriptor) return null;

    return (
      <TrafficLightOverlayMesh
        descriptor={descriptor}
        isSelected={isSelected}
        worldPos={worldPos}
        worldQuat={worldQuat}
      />
    );
  },
);

SignalSelectionOverlay.displayName = 'SignalSelectionOverlay';

// ---------------------------------------------------------------------------
// Internal mesh with Outlines only (invisible mesh)
// ---------------------------------------------------------------------------

interface TrafficLightOverlayMeshProps {
  descriptor: SignalDescriptor;
  isSelected: boolean;
  worldPos: THREE.Vector3;
  worldQuat: THREE.Quaternion;
}

const TrafficLightOverlayMesh: React.FC<TrafficLightOverlayMeshProps> = React.memo(
  ({ descriptor, isSelected, worldPos, worldQuat }) => {
    const { housing } = descriptor;

    const boxGeo = useMemo(
      () => getSharedBox(housing.height, housing.width, housing.depth),
      [housing.width, housing.height, housing.depth],
    );

    return (
      <mesh
        position={worldPos}
        quaternion={worldQuat}
        geometry={boxGeo}
        material={invisibleMaterial}
      >
        <Outlines
          thickness={isSelected ? OUTLINE_THICKNESS.selected.signal : OUTLINE_THICKNESS.hovered.signal}
          color={isSelected ? SELECTION_COLORS.selected : SELECTION_COLORS.hovered}
        />
      </mesh>
    );
  },
);

TrafficLightOverlayMesh.displayName = 'TrafficLightOverlayMesh';
