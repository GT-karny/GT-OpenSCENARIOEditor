/**
 * Renders a single non-traffic-light signal entity (stop, speed limit, generic).
 * Poles and traffic light heads are handled by InstancedPoles / InstancedTrafficLights.
 * This component is only used for the few non-instanced signal types.
 *
 * Hover/click detection is handled externally by SignalHoverHandler via manual
 * raycasting. The signal key is stored in group.userData.signalKey for lookup.
 */

import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import type { OdrSignal } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import { DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { StopSignSignal } from './signal-types/StopSignSignal.js';
import { SpeedLimitSignal } from './signal-types/SpeedLimitSignal.js';
import { GenericSignal } from './signal-types/GenericSignal.js';

interface TrafficSignalEntityProps {
  signal: OdrSignal;
  position: WorldCoords;
  category: SignalCategory;
  showLabel: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  /** Signal key used for manual raycast lookup (stored in userData) */
  signalKey: string;
}

export const TrafficSignalEntity: React.FC<TrafficSignalEntityProps> = React.memo(
  ({ signal, position, category, isSelected, isHovered, signalKey }) => {
    const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;

    const userData = useMemo(() => ({ signalKey }), [signalKey]);

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Signal head: positioned at top of pole (pole is rendered by InstancedPoles) */}
        <group position={[0, 0, poleHeight]} userData={userData}>
          {category === 'stopSign' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <StopSignSignal />
              {isSelected && <Outlines thickness={0.08} color="#FFFF00" />}
              {!isSelected && isHovered && <Outlines thickness={0.15} color="#44DDFF" />}
            </group>
          )}

          {category === 'speedLimit' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <SpeedLimitSignal value={signal.value} />
              {isSelected && <Outlines thickness={0.08} color="#FFFF00" />}
              {!isSelected && isHovered && <Outlines thickness={0.15} color="#44DDFF" />}
            </group>
          )}

          {category === 'generic' && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <GenericSignal typeLabel={signal.type} />
              {isSelected && <Outlines thickness={0.08} color="#FFFF00" />}
              {!isSelected && isHovered && <Outlines thickness={0.15} color="#44DDFF" />}
            </group>
          )}
        </group>
      </group>
    );
  },
);

TrafficSignalEntity.displayName = 'TrafficSignalEntity';
