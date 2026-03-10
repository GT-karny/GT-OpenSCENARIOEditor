/**
 * Renders a single traffic signal entity with type-specific geometry and a pole.
 * Dispatches to TrafficLightSignal, StopSignSignal, SpeedLimitSignal, or GenericSignal.
 * Supports selection and hover visual feedback.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import type { OdrSignal } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import {
  POLE_RADIUS,
  POLE_COLOR,
  TRAFFIC_LIGHT,
  DEFAULT_SIGNAL_HEIGHT,
} from '../utils/signal-geometry.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { getSharedCylinder } from '../utils/shared-geometries.js';
import { getSharedStandardMaterial } from '../utils/shared-materials.js';
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
  isSelected?: boolean;
  onClick?: () => void;
  /** Current active state for traffic lights (PR3) */
  activeState?: string;
}

export const TrafficSignalEntity: React.FC<TrafficSignalEntityProps> = React.memo(
  ({ signal, position, category, showLabel, isSelected, onClick, activeState }) => {
    const [isHovered, setIsHovered] = useState(false);
    const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;

    // Resolve descriptor for traffic light signals
    const descriptor = useMemo(
      () => (category === 'trafficLight' ? resolveSignalDescriptor(signal) : null),
      [signal, category],
    );

    // Signal head vertical offset depends on category
    const headHeight = descriptor
      ? descriptor.housing.height
      : category === 'trafficLight'
        ? TRAFFIC_LIGHT.housingHeight
        : 0;

    const handleClick = useCallback(
      (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onClick?.();
      },
      [onClick],
    );

    const handlePointerOver = useCallback(
      (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        setIsHovered(true);
      },
      [],
    );

    const handlePointerOut = useCallback(() => {
      setIsHovered(false);
    }, []);

    // Shared pole geometry & material
    const poleGeo = useMemo(
      () => getSharedCylinder(POLE_RADIUS, poleHeight, 8),
      [poleHeight],
    );
    const poleMat = useMemo(
      () => getSharedStandardMaterial({ color: POLE_COLOR, roughness: 0.8 }),
      [],
    );

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Pole: from ground up to signal head (cylinderGeometry is Y-aligned, rotate to Z-up) */}
        <mesh position={[0, 0, poleHeight / 2]} rotation={[Math.PI / 2, 0, 0]} geometry={poleGeo} material={poleMat} />

        {/* Signal head: positioned at top of pole, interactive */}
        <group
          position={[0, 0, poleHeight]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {category === 'trafficLight' && descriptor && (
            <group position={[0, 0, headHeight / 2]}>
              <TrafficLightSignal descriptor={descriptor} activeState={activeState} />
              {isSelected && <Outlines thickness={0.08} color="#FFFF00" />}
              {!isSelected && isHovered && <Outlines thickness={0.15} color="#44DDFF" />}
            </group>
          )}

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
