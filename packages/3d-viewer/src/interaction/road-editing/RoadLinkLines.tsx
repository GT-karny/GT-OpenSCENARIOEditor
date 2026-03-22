/**
 * Visual lines between connected road endpoints.
 * Shows cyan lines between roads that have successor/predecessor links.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument, OdrRoad, OdrGeometry } from '@osce/shared';

interface RoadLinkLinesProps {
  openDriveDocument: OpenDriveDocument;
}

function computeEndPosition(planView: readonly OdrGeometry[]): { x: number; y: number } | null {
  if (planView.length === 0) return null;

  const last = planView[planView.length - 1];

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

function getRoadEndpoint(road: OdrRoad, contactPoint: 'start' | 'end'): [number, number] | null {
  if (road.planView.length === 0) return null;

  if (contactPoint === 'start') {
    const first = road.planView[0];
    return [first.x, first.y];
  }

  const end = computeEndPosition(road.planView);
  return end ? [end.x, end.y] : null;
}

interface LinkSegment {
  key: string;
  from: [number, number];
  to: [number, number];
}

export function RoadLinkLines({ openDriveDocument }: RoadLinkLinesProps) {
  const segments = useMemo(() => {
    const result: LinkSegment[] = [];
    const seen = new Set<string>();
    const roadMap = new Map(openDriveDocument.roads.map((r) => [r.id, r]));

    for (const road of openDriveDocument.roads) {
      if (!road.link) continue;

      // Check successor
      if (road.link.successor && road.link.successor.elementType === 'road') {
        const pairKey = [road.id, road.link.successor.elementId].sort().join(':');
        if (!seen.has(pairKey)) {
          seen.add(pairKey);
          const targetRoad = roadMap.get(road.link.successor.elementId);
          if (targetRoad) {
            const from = getRoadEndpoint(road, 'end');
            const to = getRoadEndpoint(targetRoad, road.link.successor.contactPoint ?? 'start');
            if (from && to) {
              result.push({ key: pairKey, from, to });
            }
          }
        }
      }

      // Check predecessor
      if (road.link.predecessor && road.link.predecessor.elementType === 'road') {
        const pairKey = [road.id, road.link.predecessor.elementId].sort().join(':');
        if (!seen.has(pairKey)) {
          seen.add(pairKey);
          const targetRoad = roadMap.get(road.link.predecessor.elementId);
          if (targetRoad) {
            const from = getRoadEndpoint(road, 'start');
            const to = getRoadEndpoint(targetRoad, road.link.predecessor.contactPoint ?? 'end');
            if (from && to) {
              result.push({ key: pairKey, from, to });
            }
          }
        }
      }
    }

    return result;
  }, [openDriveDocument]);

  const lineObjects = useMemo(() => {
    return segments.map((seg) => {
      const points = [
        new THREE.Vector3(seg.from[0], seg.from[1], 0.3),
        new THREE.Vector3(seg.to[0], seg.to[1], 0.3),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: '#22d3ee',
        transparent: true,
        opacity: 0.6,
      });
      const line = new THREE.Line(geometry, material);
      return { key: seg.key, line };
    });
  }, [segments]);

  if (lineObjects.length === 0) return null;

  return (
    <group>
      {lineObjects.map(({ key, line }) => (
        <primitive key={key} object={line} />
      ))}
    </group>
  );
}
