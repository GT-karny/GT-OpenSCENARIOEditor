/**
 * Tangent direction handle extending from a control point.
 * Shows the heading direction as a line + small sphere.
 * Visual-only (not draggable in Phase 4-A).
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { OdrGeometry } from '@osce/shared';

interface TangentHandleProps {
  /** Geometry segment data */
  geometry: OdrGeometry;
  /** Whether the parent control point is selected */
  selected: boolean;
  /** Handle length in meters */
  handleLength?: number;
}

export function TangentHandle({
  geometry,
  selected,
  handleLength = 3,
}: TangentHandleProps) {
  // Compute tangent endpoint in OpenDRIVE coords
  const { endPos, linePoints } = useMemo(() => {
    const sx = geometry.x;
    const sy = geometry.y;
    const hdg = geometry.hdg;

    // Tangent direction: heading angle from x-axis
    const ex = sx + Math.cos(hdg) * handleLength;
    const ey = sy + Math.sin(hdg) * handleLength;

    const start = new THREE.Vector3(sx, sy, 0);
    const end = new THREE.Vector3(ex, ey, 0);

    return {
      startPos: start,
      endPos: end,
      linePoints: [start, end],
    };
  }, [geometry.x, geometry.y, geometry.hdg, handleLength]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geo;
  }, [linePoints]);

  if (!selected) return null;

  return (
    <group>
      {/* Tangent line */}
      <line>
        <bufferGeometry attach="geometry" {...lineGeometry} />
        <lineBasicMaterial color="#9b84e8" opacity={0.6} transparent linewidth={1} />
      </line>

      {/* Endpoint sphere */}
      <mesh position={[endPos.x, endPos.y, endPos.z]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#9b84e8" emissive="#9b84e8" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
