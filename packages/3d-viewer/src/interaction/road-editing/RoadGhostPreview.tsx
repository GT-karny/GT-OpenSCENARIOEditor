/**
 * Semi-transparent road mesh preview during 2-point road creation.
 * Builds a temporary OdrRoad from start/end points and renders it as a ghost.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { OdrRoad, OdrLaneSection } from '@osce/shared';
import { generateRoadMesh } from '@osce/opendrive';
import { computeAutoArc } from './arc-math.js';

interface RoadGhostPreviewProps {
  /** Start point in OpenDRIVE coordinates */
  startX: number;
  startY: number;
  startHdg: number;
  /** End point (cursor) in OpenDRIVE coordinates */
  endX: number;
  endY: number;
  /** Lane sections to use for the ghost road */
  lanes: OdrLaneSection[];
  /** Whether the start heading is constrained (snapped/chained) */
  headingConstrained: boolean;
}

export function RoadGhostPreview({
  startX,
  startY,
  startHdg,
  endX,
  endY,
  lanes,
  headingConstrained,
}: RoadGhostPreviewProps) {
  const prevKeyRef = useRef<string>('');
  const prevMeshRef = useRef<ReturnType<typeof generateRoadMesh> | null>(null);

  const meshData = useMemo(() => {
    const chord = Math.hypot(endX - startX, endY - startY);
    if (chord < 0.5) return prevMeshRef.current;

    // Throttle: skip if input hasn't changed meaningfully
    const key = `${startX.toFixed(1)},${startY.toFixed(1)},${startHdg.toFixed(2)},${endX.toFixed(1)},${endY.toFixed(1)},${headingConstrained}`;
    if (key === prevKeyRef.current) return prevMeshRef.current;
    prevKeyRef.current = key;

    const arc = computeAutoArc(startX, startY, startHdg, endX, endY, headingConstrained);

    // Build a temporary road
    const tempRoad: OdrRoad = {
      id: '__ghost__',
      name: '',
      length: arc.arcLength,
      junction: '-1',
      planView: [{
        s: 0,
        x: startX,
        y: startY,
        hdg: arc.hdg,
        length: arc.arcLength,
        type: arc.type,
        ...(arc.type === 'arc' ? { curvature: arc.curvature } : {}),
      }],
      lanes,
      elevationProfile: [],
      lateralProfile: [],
      laneOffset: [],
      objects: [],
      signals: [],
    };

    try {
      const result = generateRoadMesh(tempRoad);
      prevMeshRef.current = result;
      return result;
    } catch {
      return prevMeshRef.current;
    }
  }, [startX, startY, startHdg, endX, endY, lanes, headingConstrained]);

  if (!meshData) return null;

  return (
    <group>
      {meshData.laneSections.map((section, si) =>
        section.lanes.map((lane, li) => (
          <mesh key={`ghost-${si}-${li}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[lane.vertices, 3]}
              />
              <bufferAttribute
                attach="index"
                args={[lane.indices, 1]}
              />
            </bufferGeometry>
            <meshStandardMaterial
              color={lane.laneType === 'driving' ? '#6b7db3' : '#555'}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )),
      )}
    </group>
  );
}
