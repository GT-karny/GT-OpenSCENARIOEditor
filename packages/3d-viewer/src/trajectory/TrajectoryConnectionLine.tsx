/**
 * Renders line segments connecting trajectory points.
 * Uses drei's Line component (Line2) for consistent line width.
 * Points are elevated by +0.15 in Z to avoid z-fighting with road surface.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

interface TrajectoryConnectionLineProps {
  points: Array<{ x: number; y: number; z: number }>;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

const DEFAULT_COLOR = '#FF8800';
const Z_OFFSET = 0.15;

export const TrajectoryConnectionLine: React.FC<TrajectoryConnectionLineProps> = React.memo(
  ({ points, color = DEFAULT_COLOR, lineWidth = 3, dashed = false, dashSize = 0.5, gapSize = 0.3, onClick }) => {
    const linePoints = useMemo(() => {
      return points.map(
        (p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number],
      );
    }, [points]);

    if (linePoints.length < 2) return null;

    return (
      <Line
        points={linePoints}
        color={color}
        lineWidth={lineWidth}
        dashed={dashed}
        dashSize={dashSize}
        gapSize={gapSize}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick?.(e);
        }}
      />
    );
  },
);

TrajectoryConnectionLine.displayName = 'TrajectoryConnectionLine';
