/**
 * Renders a traffic light signal from a SignalDescriptor.
 * Supports variable bulb counts (1, 2, 3), arrow overlays, and pedestrian silhouettes.
 */

import React, { useMemo } from 'react';
import type { SignalDescriptor, BulbDefinition, BulbColor } from '../../utils/signal-catalog.js';
import { TRAFFIC_LIGHT } from '../../utils/signal-geometry.js';
import { isBulbActiveByIndex } from '../../utils/parse-traffic-light-state.js';
import { getShape } from '../../utils/signal-shapes.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BULB_SPACING = 0.33;

const BULB_COLORS: Record<BulbColor, string> = {
  red: TRAFFIC_LIGHT.bulbColors.red,
  yellow: TRAFFIC_LIGHT.bulbColors.yellow,
  green: TRAFFIC_LIGHT.bulbColors.green,
};

const OFF_BULB_COLORS: Record<BulbColor, string> = {
  red: TRAFFIC_LIGHT.offBulbColors.red,
  yellow: TRAFFIC_LIGHT.offBulbColors.yellow,
  green: TRAFFIC_LIGHT.offBulbColors.green,
};

const ON_EMISSIVE = TRAFFIC_LIGHT.onEmissiveIntensity;
const OFF_EMISSIVE = TRAFFIC_LIGHT.offEmissiveIntensity;
const HOUSING_COLOR = TRAFFIC_LIGHT.housingColor;

// ---------------------------------------------------------------------------
// Bulb offset computation
// ---------------------------------------------------------------------------

function computeBulbOffsets(bulbCount: number): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < bulbCount; i++) {
    offsets.push(((bulbCount - 1) / 2 - i) * BULB_SPACING);
  }
  return offsets;
}

// ---------------------------------------------------------------------------
// BulbRenderer sub-component
// ---------------------------------------------------------------------------

interface BulbRendererProps {
  bulb: BulbDefinition;
  index: number;
  offset: number;
  radius: number;
  housingDepth: number;
  activeState?: string;
}

const BulbRenderer: React.FC<BulbRendererProps> = React.memo(
  ({ bulb, index, offset, radius, housingDepth, activeState }) => {
    const isActive = activeState ? isBulbActiveByIndex(activeState, index, bulb.color) : false;

    const onColor = BULB_COLORS[bulb.color];
    const offColor = OFF_BULB_COLORS[bulb.color];
    const color = isActive ? onColor : offColor;
    const emissiveIntensity = isActive ? ON_EMISSIVE : OFF_EMISSIVE;

    const overlayShape = useMemo(() => getShape(bulb.shape), [bulb.shape]);
    const isPedestrian = bulb.shape === 'pedestrian-stop' || bulb.shape === 'pedestrian-go';
    const overlayScale = radius * 1.2;

    return (
      <group position={[housingDepth / 2 + 0.01, 0, offset]}>
        {/* Base sphere */}
        <mesh>
          <sphereGeometry args={[radius, 16, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.3}
          />
        </mesh>

        {/* Shape overlay (arrow, silhouette) */}
        {overlayShape && (
          <group position={[radius + 0.001, 0, 0]} rotation={[Math.PI / 2, Math.PI / 2, 0]}>
            <mesh scale={[overlayScale, overlayScale, 1]}>
              <shapeGeometry args={[overlayShape]} />
              <meshStandardMaterial
                color="#111111"
                emissive="#000000"
                emissiveIntensity={0}
                transparent
                opacity={isActive ? 0.85 : 0.3}
                depthWrite={false}
                depthTest={false}
                side={2} /* DoubleSide */
              />
            </mesh>

            {/* Pedestrian head circle */}
            {isPedestrian && (
              <mesh position={[0, 0.45 * overlayScale, 0]}>
                <circleGeometry args={[0.12 * overlayScale, 12]} />
                <meshStandardMaterial
                  color="#111111"
                  emissive="#000000"
                  emissiveIntensity={0}
                  transparent
                  opacity={isActive ? 0.85 : 0.3}
                  depthWrite={false}
                  depthTest={false}
                  side={2}
                />
              </mesh>
            )}
          </group>
        )}
      </group>
    );
  },
);

BulbRenderer.displayName = 'BulbRenderer';

// ---------------------------------------------------------------------------
// TrafficLightSignal
// ---------------------------------------------------------------------------

interface TrafficLightSignalProps {
  /** Signal descriptor from the catalog */
  descriptor: SignalDescriptor;
  /** Current active state string (e.g., "green", "on;off;off"). Undefined = all off. */
  activeState?: string;
}

export const TrafficLightSignal: React.FC<TrafficLightSignalProps> = React.memo(
  ({ descriptor, activeState }) => {
    const { bulbs, housing, bulbRadius } = descriptor;
    const offsets = useMemo(() => computeBulbOffsets(bulbs.length), [bulbs.length]);

    return (
      <group>
        {/* Housing box */}
        <mesh>
          <boxGeometry args={[housing.depth, housing.width, housing.height]} />
          <meshStandardMaterial color={HOUSING_COLOR} roughness={0.9} />
        </mesh>

        {/* Bulbs */}
        {bulbs.map((bulb, index) => (
          <BulbRenderer
            key={index}
            bulb={bulb}
            index={index}
            offset={offsets[index]}
            radius={bulbRadius}
            housingDepth={housing.depth}
            activeState={activeState}
          />
        ))}
      </group>
    );
  },
);

TrafficLightSignal.displayName = 'TrafficLightSignal';
