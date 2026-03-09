/**
 * Renders a single traffic signal entity with type-specific geometry and a pole.
 * Dispatches to TrafficLightSignal, StopSignSignal, SpeedLimitSignal, or GenericSignal.
 */

import React from 'react';
import type { OdrSignal } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import { POLE_RADIUS, POLE_COLOR, TRAFFIC_LIGHT, DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { TrafficLightSignal } from './signal-types/TrafficLightSignal.js';
import { StopSignSignal } from './signal-types/StopSignSignal.js';
import { SpeedLimitSignal } from './signal-types/SpeedLimitSignal.js';
import { GenericSignal } from './signal-types/GenericSignal.js';
import { SignalLabel } from './SignalLabel.js';

interface TrafficSignalEntityProps {
  signal: OdrSignal;
  position: WorldCoords;
  category: SignalCategory;
  showLabel: boolean;
  /** Current active state for traffic lights (PR3) */
  activeState?: string;
}

export const TrafficSignalEntity: React.FC<TrafficSignalEntityProps> = React.memo(
  ({ signal, position, category, showLabel, activeState }) => {
    const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;

    // Signal head vertical offset depends on category
    const headHeight = category === 'trafficLight' ? TRAFFIC_LIGHT.housingHeight : 0;

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Pole: from ground up to signal head */}
        <mesh position={[0, 0, poleHeight / 2]}>
          <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, poleHeight, 8]} />
          <meshStandardMaterial color={POLE_COLOR} roughness={0.8} />
        </mesh>

        {/* Signal head: positioned at top of pole */}
        <group position={[0, 0, poleHeight]}>
          {category === 'trafficLight' && (
            <group position={[0, 0, headHeight / 2]}>
              <TrafficLightSignal activeState={activeState} />
            </group>
          )}

          {category === 'stopSign' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <StopSignSignal />
            </group>
          )}

          {category === 'speedLimit' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <SpeedLimitSignal value={signal.value} />
            </group>
          )}

          {category === 'generic' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <GenericSignal typeLabel={signal.type} />
            </group>
          )}
        </group>

        {/* Label above signal head */}
        {showLabel && (
          <SignalLabel
            name={signal.name ?? signal.id}
            position={[0, 0, poleHeight + headHeight + 0.5]}
          />
        )}
      </group>
    );
  },
);

TrafficSignalEntity.displayName = 'TrafficSignalEntity';
