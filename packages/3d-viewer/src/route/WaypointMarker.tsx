/**
 * Renders a diamond/rhombus marker at a waypoint position.
 * Uses OctahedronGeometry with non-uniform scale for a diamond look.
 * Shows an index label above the marker using drei's Html component.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

interface WaypointMarkerProps {
  position: [number, number, number];
  heading: number;
  index: number;
  isSelected: boolean;
  onClick?: () => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

const SELECTED_COLOR = '#FFCC00';
const UNSELECTED_COLOR = '#00CCCC';

export const WaypointMarker: React.FC<WaypointMarkerProps> = React.memo(
  ({ position, heading, index, isSelected, onClick, onContextMenu }) => {
    const color = isSelected ? SELECTED_COLOR : UNSELECTED_COLOR;

    return (
      <group position={position} rotation={[0, 0, heading]}>
        {/* Diamond marker (octahedron with non-uniform scale) */}
        <mesh
          scale={[0.8, 1.2, 0.8]}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            onContextMenu?.(e);
          }}
        >
          <octahedronGeometry args={[0.75, 0]} />
          <meshBasicMaterial
            color={color}
            depthTest={false}
            transparent
            opacity={isSelected ? 0.95 : 0.8}
          />
        </mesh>

        {/* Index label above marker */}
        <Html
          position={[0, 0, 1.8]}
          center
          style={{
            fontSize: '11px',
            color: isSelected ? '#FFCC00' : '#FFFFFF',
            backgroundColor: isSelected ? 'rgba(60,60,0,0.8)' : 'rgba(0,0,0,0.6)',
            padding: '1px 5px',
            borderRadius: '3px',
            border: isSelected ? '1px solid #FFCC00' : '1px solid transparent',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          }}
        >
          {index}
        </Html>
      </group>
    );
  },
);

WaypointMarker.displayName = 'WaypointMarker';
