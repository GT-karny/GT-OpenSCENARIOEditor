/**
 * Renders a circular speed limit sign with a number.
 */

import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { SPEED_LIMIT_SIGN } from '../../utils/signal-geometry.js';

interface SpeedLimitSignalProps {
  /** Speed value to display (e.g., 60) */
  value?: number;
}

const { radius, faceColor, borderColor, borderWidth, textColor } = SPEED_LIMIT_SIGN;

export const SpeedLimitSignal: React.FC<SpeedLimitSignalProps> = React.memo(({ value }) => {
  return (
    <group>
      {/* Red border (outer circle) */}
      <mesh>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color={borderColor} side={THREE.DoubleSide} />
      </mesh>

      {/* White face (inner circle) */}
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[radius - borderWidth, 32]} />
        <meshStandardMaterial color={faceColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Speed value text */}
      {value != null && (
        <Text
          position={[0, 0, 0.01]}
          fontSize={radius * 0.9}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {String(Math.round(value))}
        </Text>
      )}
    </group>
  );
});

SpeedLimitSignal.displayName = 'SpeedLimitSignal';
