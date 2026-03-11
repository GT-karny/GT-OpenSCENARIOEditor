/**
 * Renders selection/hover Outlines for a single traffic signal.
 * Overlaid on top of the InstancedMesh at the correct world position.
 * Only rendered for at most one signal (the selected or hovered one).
 */

import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import type { ResolvedSignal } from './TrafficSignalGroup.js';
import type { SignalDescriptor } from '../utils/signal-catalog.js';
import { DEFAULT_SIGNAL_HEIGHT, TRAFFIC_LIGHT } from '../utils/signal-geometry.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { getSharedBox } from '../utils/shared-geometries.js';
import { getSignalMaterials } from '../utils/signal-texture.js';

interface SignalSelectionOverlayProps {
  signal: ResolvedSignal;
  activeState?: string;
  isSelected: boolean;
}

export const SignalSelectionOverlay: React.FC<SignalSelectionOverlayProps> = React.memo(
  ({ signal: rs, activeState, isSelected }) => {
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

    if (category !== 'trafficLight' || !descriptor) return null;

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        <group position={[0, 0, poleHeight + headHeight / 2]}>
          <TrafficLightOverlayMesh
            descriptor={descriptor}
            activeState={activeState}
            isSelected={isSelected}
          />
        </group>
      </group>
    );
  },
);

SignalSelectionOverlay.displayName = 'SignalSelectionOverlay';

// ---------------------------------------------------------------------------
// Internal mesh with Outlines
// ---------------------------------------------------------------------------

interface TrafficLightOverlayMeshProps {
  descriptor: SignalDescriptor;
  activeState?: string;
  isSelected: boolean;
}

const TrafficLightOverlayMesh: React.FC<TrafficLightOverlayMeshProps> = React.memo(
  ({ descriptor, activeState, isSelected }) => {
    const { housing } = descriptor;

    const boxGeo = useMemo(
      () => getSharedBox(housing.height, housing.width, housing.depth),
      [housing.width, housing.height, housing.depth],
    );

    const materials = useMemo(
      () => getSignalMaterials(descriptor, activeState),
      [descriptor, activeState],
    );

    return (
      <mesh rotation={[0, Math.PI / 2, 0]} geometry={boxGeo} material={materials}>
        <Outlines
          thickness={isSelected ? 0.08 : 0.15}
          color={isSelected ? '#FFFF00' : '#44DDFF'}
        />
      </mesh>
    );
  },
);

TrafficLightOverlayMesh.displayName = 'TrafficLightOverlayMesh';
