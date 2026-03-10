/**
 * Renders a 3-bulb vertical traffic light (red/yellow/green).
 * Supports esmini positional states ("on;off;off") and color name states ("red").
 */

import React from 'react';
import { TRAFFIC_LIGHT } from '../../utils/signal-geometry.js';
import { isBulbActive } from '../../utils/parse-traffic-light-state.js';

interface TrafficLightSignalProps {
  /** Current active state string (e.g., "green", "on;off;off"). Undefined = all off. */
  activeState?: string;
}

const { housingWidth, housingDepth, housingHeight, bulbRadius, bulbOffsets, bulbColors, offBulbColors, housingColor, offEmissiveIntensity, onEmissiveIntensity } = TRAFFIC_LIGHT;

const BULB_DEFS = [
  { offset: bulbOffsets[0], onColor: bulbColors.red, offColor: offBulbColors.red, key: 'red' },
  { offset: bulbOffsets[1], onColor: bulbColors.yellow, offColor: offBulbColors.yellow, key: 'yellow' },
  { offset: bulbOffsets[2], onColor: bulbColors.green, offColor: offBulbColors.green, key: 'green' },
] as const;

export const TrafficLightSignal: React.FC<TrafficLightSignalProps> = React.memo(
  ({ activeState }) => {
    return (
      <group>
        {/* Housing box */}
        <mesh>
          <boxGeometry args={[housingDepth, housingWidth, housingHeight]} />
          <meshStandardMaterial color={housingColor} roughness={0.9} />
        </mesh>

        {/* Three bulbs */}
        {BULB_DEFS.map(({ offset, onColor, offColor, key }) => {
          const isActive = activeState ? isBulbActive(activeState, key) : false;
          const color = isActive ? onColor : offColor;

          return (
            <mesh key={key} position={[housingDepth / 2 + 0.01, 0, offset]}>
              <sphereGeometry args={[bulbRadius, 16, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isActive ? onEmissiveIntensity : offEmissiveIntensity}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>
    );
  },
);

TrafficLightSignal.displayName = 'TrafficLightSignal';
