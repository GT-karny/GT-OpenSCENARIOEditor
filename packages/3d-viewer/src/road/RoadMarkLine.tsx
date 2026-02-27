/**
 * Renders a road marking as a line using Three.js.
 * Uses THREE.Line2 via drei's <Line> for consistent line width across platforms.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { RoadMarkMeshData } from '@osce/shared';

interface RoadMarkLineProps {
  markMesh: RoadMarkMeshData;
}

export const RoadMarkLine: React.FC<RoadMarkLineProps> = React.memo(({ markMesh }) => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < markMesh.vertices.length; i += 3) {
      pts.push([markMesh.vertices[i], markMesh.vertices[i + 1], markMesh.vertices[i + 2]]);
    }
    return pts;
  }, [markMesh.vertices]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color={markMesh.color}
      lineWidth={Math.max(markMesh.width * 10, 1)}
    />
  );
});

RoadMarkLine.displayName = 'RoadMarkLine';
