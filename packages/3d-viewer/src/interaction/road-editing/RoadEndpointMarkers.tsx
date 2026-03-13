/**
 * Visual markers at the start and end of a road.
 * Start = green diamond, End = red diamond.
 * Helps users identify road direction and connection points.
 */

import { useMemo } from 'react';
import type { OdrRoad } from '@osce/shared';

interface RoadEndpointMarkersProps {
  road: OdrRoad;
}

/**
 * Compute the end position of a road from its last geometry segment.
 * For a line segment, the end is simply start + length * direction.
 */
function computeRoadEndPosition(road: OdrRoad): { x: number; y: number; hdg: number } | null {
  if (road.planView.length === 0) return null;

  const last = road.planView[road.planView.length - 1];

  // For line type, compute exact endpoint
  if (last.type === 'line') {
    return {
      x: last.x + Math.cos(last.hdg) * last.length,
      y: last.y + Math.sin(last.hdg) * last.length,
      hdg: last.hdg,
    };
  }

  // For arc type, compute endpoint along the arc
  if (last.type === 'arc' && last.curvature !== undefined) {
    const c = last.curvature;
    if (Math.abs(c) < 1e-10) {
      // Effectively a line
      return {
        x: last.x + Math.cos(last.hdg) * last.length,
        y: last.y + Math.sin(last.hdg) * last.length,
        hdg: last.hdg,
      };
    }
    const endHdg = last.hdg + c * last.length;
    const r = 1 / c;
    const dx = r * (Math.sin(endHdg) - Math.sin(last.hdg));
    const dy = r * (-Math.cos(endHdg) + Math.cos(last.hdg));
    return {
      x: last.x + dx,
      y: last.y + dy,
      hdg: endHdg,
    };
  }

  // Fallback: approximate using heading + length
  return {
    x: last.x + Math.cos(last.hdg) * last.length,
    y: last.y + Math.sin(last.hdg) * last.length,
    hdg: last.hdg,
  };
}

export function RoadEndpointMarkers({ road }: RoadEndpointMarkersProps) {
  const startGeo = road.planView[0];
  const endPoint = useMemo(() => computeRoadEndPosition(road), [road]);

  if (!startGeo) return null;

  return (
    <group>
      {/* Start marker (green) */}
      <mesh position={[startGeo.x, startGeo.y, 0.1]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.6, 0.6, 0.15]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.3} />
      </mesh>

      {/* End marker (red) */}
      {endPoint && (
        <mesh position={[endPoint.x, endPoint.y, 0.1]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.6, 0.6, 0.15]} />
          <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}
