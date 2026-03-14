/**
 * Visual markers at the start and end of a road.
 * Start = green diamond (blue if connected), End = red diamond (blue if connected).
 * Helps users identify road direction and connection points.
 * Right-click opens a context menu for adding/disconnecting roads.
 */

import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import type { OdrRoad } from '@osce/shared';

interface RoadEndpointMarkersProps {
  road: OdrRoad;
  /** Callback when an endpoint is right-clicked */
  onEndpointContextMenu?: (contactPoint: 'start' | 'end', screenX: number, screenY: number) => void;
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

export function RoadEndpointMarkers({ road, onEndpointContextMenu }: RoadEndpointMarkersProps) {
  const { gl } = useThree();
  const startGeo = road.planView[0];
  const endPoint = useMemo(() => computeRoadEndPosition(road), [road]);

  const hasStartLink = !!road.link?.predecessor;
  const hasEndLink = !!road.link?.successor;

  // Colors: blue for connected, green/red for unconnected
  const startColor = hasStartLink ? '#3b82f6' : '#4ade80';
  const endColor = hasEndLink ? '#3b82f6' : '#f87171';

  const handleStartContextMenu = useCallback(
    (e: THREE.Event & { nativeEvent: MouseEvent }) => {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopPropagation();
      const rect = gl.domElement.getBoundingClientRect();
      onEndpointContextMenu?.(
        'start',
        e.nativeEvent.clientX - rect.left + rect.left,
        e.nativeEvent.clientY - rect.top + rect.top,
      );
    },
    [gl, onEndpointContextMenu],
  );

  const handleEndContextMenu = useCallback(
    (e: THREE.Event & { nativeEvent: MouseEvent }) => {
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopPropagation();
      const rect = gl.domElement.getBoundingClientRect();
      onEndpointContextMenu?.(
        'end',
        e.nativeEvent.clientX - rect.left + rect.left,
        e.nativeEvent.clientY - rect.top + rect.top,
      );
    },
    [gl, onEndpointContextMenu],
  );

  if (!startGeo) return null;

  return (
    <group>
      {/* Start marker */}
      <mesh
        position={[startGeo.x, startGeo.y, 0.1]}
        rotation={[0, 0, Math.PI / 4]}
        onContextMenu={onEndpointContextMenu ? handleStartContextMenu : undefined}
      >
        <boxGeometry args={[0.6, 0.6, 0.15]} />
        <meshStandardMaterial color={startColor} emissive={startColor} emissiveIntensity={0.3} />
      </mesh>

      {/* End marker */}
      {endPoint && (
        <mesh
          position={[endPoint.x, endPoint.y, 0.1]}
          rotation={[0, 0, Math.PI / 4]}
          onContextMenu={onEndpointContextMenu ? handleEndContextMenu : undefined}
        >
          <boxGeometry args={[0.6, 0.6, 0.15]} />
          <meshStandardMaterial color={endColor} emissive={endColor} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}
