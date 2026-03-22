/**
 * Interactive endpoint markers for junction creation mode.
 * Shows clickable markers at all road endpoints; user selects 2+ to create a junction.
 * Connected endpoints are greyed out and non-interactive.
 */

import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { OpenDriveDocument, OdrRoad } from '@osce/shared';

interface EndpointInfo {
  roadId: string;
  contactPoint: 'start' | 'end';
  x: number;
  y: number;
  connected: boolean;
}

interface JunctionCreateInteractionProps {
  openDriveDocument: OpenDriveDocument;
  selectedEndpoints: Array<{ roadId: string; contactPoint: 'start' | 'end' }>;
  hoveredEndpoint: { roadId: string; contactPoint: 'start' | 'end' } | null;
  onEndpointClick?: (roadId: string, contactPoint: 'start' | 'end') => void;
  onEndpointHover?: (endpoint: { roadId: string; contactPoint: 'start' | 'end' } | null) => void;
}

function computeRoadEndPosition(road: OdrRoad): { x: number; y: number } | null {
  if (road.planView.length === 0) return null;
  const last = road.planView[road.planView.length - 1];

  if (last.type === 'arc' && last.curvature !== undefined && Math.abs(last.curvature) > 1e-10) {
    const c = last.curvature;
    const endHdg = last.hdg + c * last.length;
    const r = 1 / c;
    return {
      x: last.x + r * (Math.sin(endHdg) - Math.sin(last.hdg)),
      y: last.y + r * (-Math.cos(endHdg) + Math.cos(last.hdg)),
    };
  }

  return {
    x: last.x + Math.cos(last.hdg) * last.length,
    y: last.y + Math.sin(last.hdg) * last.length,
  };
}

function isEndpointConnected(road: OdrRoad, contactPoint: 'start' | 'end'): boolean {
  if (!road.link) return false;
  return contactPoint === 'start' ? !!road.link.predecessor : !!road.link.successor;
}

/** Pulsing selected marker */
function PulsingMarker({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + 0.15 * Math.sin(clock.elapsedTime * 4);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[1.0, 1.0, 0.2]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
}

export function JunctionCreateInteraction({
  openDriveDocument,
  selectedEndpoints,
  hoveredEndpoint,
  onEndpointClick,
  onEndpointHover,
}: JunctionCreateInteractionProps) {
  // Collect all endpoints (excluding connecting roads inside junctions)
  const endpoints = useMemo<EndpointInfo[]>(() => {
    const result: EndpointInfo[] = [];
    for (const road of openDriveDocument.roads) {
      // Skip connecting roads (roads that belong to a junction)
      if (road.junction && road.junction !== '-1') continue;
      if (road.planView.length === 0) continue;

      const startGeo = road.planView[0];
      result.push({
        roadId: road.id,
        contactPoint: 'start',
        x: startGeo.x,
        y: startGeo.y,
        connected: isEndpointConnected(road, 'start'),
      });

      const endPos = computeRoadEndPosition(road);
      if (endPos) {
        result.push({
          roadId: road.id,
          contactPoint: 'end',
          x: endPos.x,
          y: endPos.y,
          connected: isEndpointConnected(road, 'end'),
        });
      }
    }
    return result;
  }, [openDriveDocument.roads]);

  const isSelected = useCallback(
    (ep: EndpointInfo) =>
      selectedEndpoints.some(
        (s) => s.roadId === ep.roadId && s.contactPoint === ep.contactPoint,
      ),
    [selectedEndpoints],
  );

  const isHovered = useCallback(
    (ep: EndpointInfo) =>
      hoveredEndpoint?.roadId === ep.roadId &&
      hoveredEndpoint?.contactPoint === ep.contactPoint,
    [hoveredEndpoint],
  );

  const handleClick = useCallback(
    (ep: EndpointInfo) => {
      if (ep.connected) return;
      onEndpointClick?.(ep.roadId, ep.contactPoint);
    },
    [onEndpointClick],
  );

  const handlePointerOver = useCallback(
    (ep: EndpointInfo) => {
      if (ep.connected) return;
      onEndpointHover?.({ roadId: ep.roadId, contactPoint: ep.contactPoint });
    },
    [onEndpointHover],
  );

  const handlePointerOut = useCallback(() => {
    onEndpointHover?.(null);
  }, [onEndpointHover]);

  return (
    <group>
      {endpoints.map((ep) => {
        const key = `${ep.roadId}-${ep.contactPoint}`;
        const selected = isSelected(ep);
        const hovered = isHovered(ep);
        const position: [number, number, number] = [ep.x, ep.y, 0.15];

        if (selected) {
          return (
            <group key={key}>
              <PulsingMarker position={position} color="#a78bfa" />
              <mesh
                position={position}
                rotation={[0, 0, Math.PI / 4]}
                onClick={() => handleClick(ep)}
                onPointerOver={() => handlePointerOver(ep)}
                onPointerOut={handlePointerOut}
              >
                <boxGeometry args={[1.4, 1.4, 0.01]} />
                <meshStandardMaterial transparent opacity={0} />
              </mesh>
            </group>
          );
        }

        if (ep.connected) {
          return (
            <mesh key={key} position={position} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.6, 0.6, 0.15]} />
              <meshStandardMaterial color="#666" transparent opacity={0.3} />
            </mesh>
          );
        }

        const color = hovered
          ? '#fbbf24'
          : ep.contactPoint === 'start'
            ? '#4ade80'
            : '#f87171';
        const emissiveIntensity = hovered ? 0.6 : 0.3;
        const size = hovered ? 0.8 : 0.7;

        return (
          <mesh
            key={key}
            position={position}
            rotation={[0, 0, Math.PI / 4]}
            onClick={() => handleClick(ep)}
            onPointerOver={() => handlePointerOver(ep)}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[size, size, 0.15]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        );
      })}
    </group>
  );
}
