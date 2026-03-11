/**
 * Renders a generic diamond/rectangle signal as fallback for unknown types.
 */

import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GENERIC_SIGNAL } from '../../utils/signal-geometry.js';

interface GenericSignalProps {
  /** Signal type string to display as label */
  typeLabel?: string;
}

const { width, height, faceColor, borderColor } = GENERIC_SIGNAL;

export const GenericSignal: React.FC<GenericSignalProps> = React.memo(({ typeLabel }) => {
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* Border */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={borderColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Face */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[width - 0.06, height - 0.06]} />
        <meshStandardMaterial color={faceColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Type label */}
      {typeLabel && (
        <Text
          position={[0, 0, 0.01]}
          rotation={[0, 0, -Math.PI / 4]}
          fontSize={0.12}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          maxWidth={width * 0.6}
          font={undefined}
        >
          {typeLabel}
        </Text>
      )}
    </group>
  );
});

GenericSignal.displayName = 'GenericSignal';
