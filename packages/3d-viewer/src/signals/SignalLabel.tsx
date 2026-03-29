/**
 * Renders a floating name label above a traffic signal using drei's Text component.
 * Rendered directly in WebGL (SDF font) — much lighter than the previous Html/DOM approach.
 * Billboard wrapping ensures the label always faces the camera.
 *
 * Labels fade in when the camera is within `maxDistance` and are hidden beyond it.
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { LABEL_COLORS } from '../constants/selection-theme.js';

interface SignalLabelProps {
  name: string;
  position: [number, number, number];
  highlighted?: boolean;
  /** Max camera distance at which the label is visible (world units). Default 80. */
  maxDistance?: number;
}

const _worldPos = new THREE.Vector3();

export const SignalLabel: React.FC<SignalLabelProps> = React.memo(
  ({ name, position, highlighted, maxDistance = 80 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const camera = useThree((s) => s.camera);

    useFrame(() => {
      if (!groupRef.current) return;
      groupRef.current.getWorldPosition(_worldPos);
      const dist = camera.position.distanceTo(_worldPos);
      const visible = dist <= maxDistance;
      if (groupRef.current.visible !== visible) {
        groupRef.current.visible = visible;
      }
    });

    return (
      <Billboard ref={groupRef} position={position}>
        <Text
          fontSize={highlighted ? 0.35 : 0.25}
          color={highlighted ? LABEL_COLORS.signal.highlighted.text : LABEL_COLORS.signal.normal.text}
          anchorX="center"
          anchorY="middle"
          outlineWidth={highlighted ? 0.025 : 0.018}
          outlineColor={highlighted ? LABEL_COLORS.signal.highlighted.outline : LABEL_COLORS.signal.normal.outline}
          fontWeight={highlighted ? 'bold' : 'normal'}
        >
          {name}
        </Text>
      </Billboard>
    );
  },
);

SignalLabel.displayName = 'SignalLabel';
