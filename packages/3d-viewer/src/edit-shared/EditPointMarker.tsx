/**
 * Shared diamond marker for route waypoints and trajectory points.
 * Uses OctahedronGeometry with non-uniform scale for a diamond look and shows an
 * index label above the marker via drei's Html. Optionally renders a time badge.
 *
 * Themed via {@link EditPrimitiveTheme} so route (cyan) and trajectory (orange)
 * markers share one implementation.
 */

import React from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { EditPrimitiveTheme } from './edit-theme.js';

interface EditPointMarkerProps {
  position: [number, number, number];
  heading: number;
  index: number;
  isSelected: boolean;
  theme: EditPrimitiveTheme;
  /** Optional time value rendered as a small badge next to the index. */
  time?: number;
  onClick?: () => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
}

export const EditPointMarker: React.FC<EditPointMarkerProps> = React.memo(
  ({ position, heading, index, isSelected, theme, time, onClick, onContextMenu }) => {
    const color = isSelected ? theme.selectedColor : theme.color;

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
            color: isSelected ? theme.selectedColor : theme.labelColor,
            backgroundColor: isSelected ? theme.labelSelectedBg : theme.labelBg,
            padding: '1px 5px',
            borderRadius: '3px',
            border: isSelected ? `1px solid ${theme.selectedColor}` : '1px solid transparent',
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

EditPointMarker.displayName = 'EditPointMarker';
