/**
 * Renders a position marker at a scenario position (action/condition).
 * Designed for visibility at distance: larger diamond with wireframe outline,
 * ground ring, and a thicker vertical stalk.
 */

import React from 'react';
import { Line } from '@react-three/drei';

interface PositionMarkerProps {
  position: [number, number, number];
  heading: number;
  category: 'action' | 'condition';
  isHighlighted: boolean;
}

const ACTION_COLOR = '#E88A4A';
const CONDITION_COLOR = '#A86AE8';
const HIGHLIGHT_COLOR = '#FFDD44';

export const PositionMarker: React.FC<PositionMarkerProps> = React.memo(
  ({ position, heading, category, isHighlighted }) => {
    const baseColor = category === 'action' ? ACTION_COLOR : CONDITION_COLOR;
    const color = isHighlighted ? HIGHLIGHT_COLOR : baseColor;
    const scale = isHighlighted ? 1.3 : 1.0;
    const opacity = isHighlighted ? 0.95 : 0.8;

    // Hover height — lift the diamond above the road surface
    const hoverZ = 2.0;

    return (
      <group position={position}>
        {/* Ground ring — visible from top-down / far away */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, 0.06]}>
          <ringGeometry args={[0.6 * scale, 0.8 * scale, 24]} />
          <meshBasicMaterial
            color={color}
            depthTest={false}
            transparent
            opacity={opacity * 0.5}
          />
        </mesh>

        {/* Vertical stalk from ground to marker */}
        <Line
          points={[
            [0, 0, 0.05],
            [0, 0, hoverZ],
          ]}
          color={color}
          lineWidth={2}
          transparent
          opacity={opacity * 0.6}
          depthTest={false}
        />

        {/* Diamond marker (octahedron) — bigger than before */}
        <group position={[0, 0, hoverZ + 0.45 * scale]} rotation={[0, 0, heading]}>
          <mesh scale={[0.5 * scale, 0.7 * scale, 0.5 * scale]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial
              color={color}
              depthTest={false}
              transparent
              opacity={opacity}
            />
          </mesh>
          {/* Wireframe outline for contrast */}
          <mesh scale={[0.5 * scale, 0.7 * scale, 0.5 * scale]}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshBasicMaterial
              color="#ffffff"
              wireframe
              depthTest={false}
              transparent
              opacity={opacity * 0.25}
            />
          </mesh>
        </group>

      </group>
    );
  },
);

PositionMarker.displayName = 'PositionMarker';
