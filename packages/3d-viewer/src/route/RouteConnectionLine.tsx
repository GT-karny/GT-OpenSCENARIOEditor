/**
 * Renders line segments connecting waypoints in a route.
 * Uses drei's Line component (Line2) for consistent line width.
 * Points are elevated by +0.15 in the Z axis (OpenDRIVE up) to avoid
 * z-fighting with the road surface.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';

interface RouteConnectionLineProps {
  points: Array<{ x: number; y: number; z: number }>;
  segmentIndex: number;
  color?: string;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

const DEFAULT_COLOR = '#00AAFF';
const Z_OFFSET = 0.15;

export const RouteConnectionLine: React.FC<RouteConnectionLineProps> = React.memo(
  ({ points, segmentIndex, color = DEFAULT_COLOR, onClick }) => {
    const linePoints = useMemo(() => {
      return points.map(
        (p) => [p.x, p.y, p.z + Z_OFFSET] as [number, number, number],
      );
    }, [points]);

    if (linePoints.length < 2) return null;

    return (
      <Line
        key={`route-line-${segmentIndex}`}
        points={linePoints}
        color={color}
        lineWidth={3}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick?.(e);
        }}
      />
    );
  },
);

RouteConnectionLine.displayName = 'RouteConnectionLine';
