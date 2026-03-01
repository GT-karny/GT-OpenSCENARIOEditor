/**
 * Renders a road marking as a line using Three.js.
 * Uses THREE.Line2 via drei's <Line> for consistent line width across platforms.
 * Supports solid and dashed line types based on OpenDRIVE road mark type.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { RoadMarkMeshData } from '@osce/shared';

interface RoadMarkLineProps {
  markMesh: RoadMarkMeshData;
}

/** Check if a road mark type represents a dashed/broken pattern. */
function isDashedType(markType: string): boolean {
  return markType === 'broken' || markType === 'broken broken'
    || markType === 'broken solid' || markType === 'solid broken';
}

export const RoadMarkLine: React.FC<RoadMarkLineProps> = React.memo(({ markMesh }) => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < markMesh.vertices.length; i += 3) {
      pts.push([markMesh.vertices[i], markMesh.vertices[i + 1], markMesh.vertices[i + 2]]);
    }
    return pts;
  }, [markMesh.vertices]);

  const dashed = useMemo(() => isDashedType(markMesh.markType), [markMesh.markType]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color={markMesh.color}
      lineWidth={Math.max(markMesh.width * 10, 1)}
      dashed={dashed}
      dashSize={dashed ? 3 : undefined}
      gapSize={dashed ? 3 : undefined}
    />
  );
});

RoadMarkLine.displayName = 'RoadMarkLine';
