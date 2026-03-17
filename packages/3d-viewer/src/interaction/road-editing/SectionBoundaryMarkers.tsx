/**
 * Visual markers for lane section boundaries.
 * Shows dashed lines at section splits and drag handles for boundary movement.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

interface SectionBoundaryMarkersProps {
  active: boolean;
  openDriveDocument: OpenDriveDocument;
  roadId: string | null;
  onBoundaryDragEnd?: (roadId: string, sectionIdx: number, newS: number) => void;
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

interface BoundaryData {
  s: number;
  sectionIdx: number;
  points: [number, number, number][];
  center: [number, number, number];
}

// Compute boundary line endpoints for a section split at given s
function computeBoundary(road: OdrRoad, sectionIdx: number, s: number): BoundaryData | null {
  const geo = road.planView[0];
  if (!geo) return null;

  // Approximate position at s using first geometry segment
  const x = geo.x + s * Math.cos(geo.hdg);
  const y = geo.y + s * Math.sin(geo.hdg);

  // Cross-road direction (perpendicular to heading)
  const perpX = -Math.sin(geo.hdg);
  const perpY = Math.cos(geo.hdg);

  // Compute road width from lane counts
  const section = road.lanes[sectionIdx];
  if (!section) return null;

  const leftWidth = Math.max(section.leftLanes.length * 3.5, 1.0);
  const rightWidth = Math.max(section.rightLanes.length * 3.5, 1.0);

  // Points from right edge to left edge (in OpenDRIVE coords inside rotation group)
  const rightEdge: [number, number, number] = [
    x - perpX * rightWidth,
    y - perpY * rightWidth,
    0.05,
  ];
  const leftEdge: [number, number, number] = [
    x + perpX * leftWidth,
    y + perpY * leftWidth,
    0.05,
  ];

  const center: [number, number, number] = [
    (rightEdge[0] + leftEdge[0]) / 2,
    (rightEdge[1] + leftEdge[1]) / 2,
    0.1,
  ];

  return { s, sectionIdx, points: [rightEdge, leftEdge], center };
}

export function SectionBoundaryMarkers({
  active,
  openDriveDocument,
  roadId,
  onBoundaryDragEnd,
  orbitControlsRef,
}: SectionBoundaryMarkersProps) {
  const road = useMemo(() => {
    if (!active || !roadId) return null;
    return openDriveDocument.roads.find((r) => r.id === roadId) ?? null;
  }, [active, roadId, openDriveDocument]);

  const boundaries = useMemo(() => {
    if (!road || road.lanes.length <= 1) return [];

    const result: BoundaryData[] = [];
    for (let i = 1; i < road.lanes.length; i++) {
      const boundary = computeBoundary(road, i, road.lanes[i].s);
      if (boundary) result.push(boundary);
    }
    return result;
  }, [road]);

  // Suppress unused variable warnings — reserved for future drag interaction
  void onBoundaryDragEnd;
  void orbitControlsRef;

  if (!road || boundaries.length === 0) return null;

  return (
    <group>
      {boundaries.map((boundary) => (
        <group key={`section-boundary-${boundary.sectionIdx}`}>
          {/* Dashed boundary line across road width */}
          <Line
            points={boundary.points}
            color="#ffaa00"
            lineWidth={1.5}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />
          {/* Drag handle sphere at boundary center */}
          <mesh position={boundary.center}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ffaa00"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
