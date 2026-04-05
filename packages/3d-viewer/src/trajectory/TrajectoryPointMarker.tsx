/**
 * Renders a diamond marker at a trajectory point position (vertex or control point).
 * Orange/amber theme (#FF8800) to distinguish from route markers (cyan).
 * Optionally shows a time badge below the index label.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

interface TrajectoryPointMarkerProps {
  position: [number, number, number];
  heading: number;
  index: number;
  isSelected: boolean;
  time?: number;
  onClick?: () => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

const SELECTED_COLOR = '#FFCC00';
const UNSELECTED_COLOR = '#FF8800';

export const TrajectoryPointMarker: React.FC<TrajectoryPointMarkerProps> = React.memo(
  ({ position, heading, index, isSelected, time, onClick, onContextMenu }) => {
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
            backgroundColor: isSelected ? 'rgba(60,40,0,0.8)' : 'rgba(40,20,0,0.7)',
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
          {time !== undefined && (
            <span style={{ fontSize: '9px', marginLeft: '3px', opacity: 0.7 }}>
              {time.toFixed(1)}s
            </span>
          )}
        </Html>
      </group>
    );
  },
);

TrajectoryPointMarker.displayName = 'TrajectoryPointMarker';
