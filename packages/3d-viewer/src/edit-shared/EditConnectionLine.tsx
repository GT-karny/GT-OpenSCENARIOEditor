/**
 * Shared connection line for route/trajectory edit overlays.
 * Uses drei's Line component (Line2) for consistent line width. Points are
 * elevated by +0.15 in Z (OpenDRIVE up) to avoid z-fighting with the road surface.
 *
 * Supports solid and dashed styles so route path segments and trajectory
 * curve/control-polygon lines share one implementation.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

interface EditConnectionLineProps {
  points: Array<{ x: number; y: number; z: number }>;
  color: string;
  lineWidth?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

const Z_OFFSET = 0.15;

export const EditConnectionLine: React.FC<EditConnectionLineProps> = React.memo(
  ({ points, color, lineWidth = 3, dashed = false, dashSize = 0.5, gapSize = 0.3, onClick }) => {
    const linePoints = useMemo(
      () => points.map((p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number]),
      [points],
    );

    if (linePoints.length < 2) return null;

    return (
      <Line
        points={linePoints}
        color={color}
        lineWidth={lineWidth}
        dashed={dashed}
        dashSize={dashSize}
        gapSize={gapSize}
        onClick={
          onClick
            ? (e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onClick(e);
              }
            : undefined
        }
      />
    );
  },
);

EditConnectionLine.displayName = 'EditConnectionLine';
