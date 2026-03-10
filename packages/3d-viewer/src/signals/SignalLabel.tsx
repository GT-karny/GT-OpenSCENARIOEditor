/**
 * Renders a floating name label above a traffic signal using drei's Text component.
 * Rendered directly in WebGL (SDF font) — much lighter than the previous Html/DOM approach.
 * Billboard wrapping ensures the label always faces the camera.
 */

import React from 'react';
import { Billboard, Text } from '@react-three/drei';

interface SignalLabelProps {
  name: string;
  position: [number, number, number];
}

export const SignalLabel: React.FC<SignalLabelProps> = React.memo(({ name, position }) => {
  return (
    <Billboard position={position}>
      <Text
        fontSize={0.18}
        color="#BBDDFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#001428"
      >
        {name}
      </Text>
    </Billboard>
  );
});

SignalLabel.displayName = 'SignalLabel';
