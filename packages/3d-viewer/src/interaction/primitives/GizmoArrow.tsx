/**
 * Reusable arrow primitive for gizmo axes.
 * Renders a cylinder shaft + cone head, aligned to a specified axis direction.
 *
 * Used by RoadGizmo (s/lane axes) and SignalGizmo (s/t axes).
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';

const DEFAULT_LENGTH = 6;
const SHAFT_R = 0.12;
const HEAD_R = 0.36;
const HEAD_LEN = 0.9;

export interface GizmoArrowProps {
  /** Arrow direction: 'x' = +X, 'y' = +Y */
  direction: 'x' | 'y';
  /** Arrow color */
  color: string;
  /** Arrow length (default 6) */
  length?: number;
  /** Pointer down handler for starting drag */
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}

/**
 * CylinderGeometry grows along the Y-axis by default.
 * - direction='x': rotate Y-up cylinder to +X via Z rotation
 * - direction='y': keep Y-up cylinder as-is
 */
export const GizmoArrow: React.FC<GizmoArrowProps> = React.memo(
  ({ direction, color, length = DEFAULT_LENGTH, onPointerDown }) => {
    const rotation: [number, number, number] =
      direction === 'x' ? [0, 0, -Math.PI / 2] : [0, 0, 0];

    return (
      <group rotation={rotation}>
        <mesh position={[0, length / 2, 0]} onPointerDown={onPointerDown}>
          <cylinderGeometry args={[SHAFT_R, SHAFT_R, length, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
        </mesh>
        <mesh position={[0, length + HEAD_LEN / 2, 0]} onPointerDown={onPointerDown}>
          <coneGeometry args={[HEAD_R, HEAD_LEN, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} depthTest={false} />
        </mesh>
      </group>
    );
  },
);

GizmoArrow.displayName = 'GizmoArrow';
