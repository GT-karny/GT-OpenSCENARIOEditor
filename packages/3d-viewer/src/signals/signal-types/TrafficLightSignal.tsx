/**
 * Renders a 3-bulb vertical traffic light (red/yellow/green).
 * In PR1, all lights are in "off" state.
 * PR3 will add activeState prop to illuminate the active light.
 */

import React from 'react';
import { TRAFFIC_LIGHT } from '../../utils/signal-geometry.js';

interface TrafficLightSignalProps {
  /** Current active state string (e.g., "green", "red", "yellow"). Undefined = all off. */
  activeState?: string;
}

const { housingWidth, housingDepth, housingHeight, bulbRadius, bulbOffsets, bulbColors, housingColor, offEmissiveIntensity, onEmissiveIntensity } = TRAFFIC_LIGHT;

const BULB_DEFS = [
  { offset: bulbOffsets[0], color: bulbColors.red, key: 'red' },
  { offset: bulbOffsets[1], color: bulbColors.yellow, key: 'yellow' },
  { offset: bulbOffsets[2], color: bulbColors.green, key: 'green' },
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
        {BULB_DEFS.map(({ offset, color, key }) => {
          const isActive = activeState
            ? activeState.toLowerCase().includes(key)
            : false;

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
