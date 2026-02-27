/**
 * Renders a single road: all lane meshes + road markings.
 * Computes road mark meshes from the OdrRoad data using the opendrive package.
 */

import React, { useMemo } from 'react';
import type { OdrRoad, RoadMeshData, RoadMarkMeshData } from '@osce/shared';
import { buildRoadMarkMesh, generateSamplePoints } from '@osce/opendrive';
import { LaneMesh } from './LaneMesh.js';
import { RoadMarkLine } from './RoadMarkLine.js';

interface RoadMeshProps {
  road: OdrRoad;
  roadMeshData: RoadMeshData;
  showRoadMarks?: boolean;
}

export const RoadMesh: React.FC<RoadMeshProps> = React.memo(
  ({ road, roadMeshData, showRoadMarks = true }) => {
    // Build road mark meshes from lane data
    const roadMarkMeshes = useMemo(() => {
      if (!showRoadMarks) return [];
      const marks: RoadMarkMeshData[] = [];

      for (let i = 0; i < road.lanes.length; i++) {
        const section = road.lanes[i];
        const sEnd =
          i + 1 < road.lanes.length ? road.lanes[i + 1].s : road.length;

        if (sEnd - section.s < 1e-6) continue;

        const sValues = generateSamplePoints(road, section.s, sEnd);
        const allLanes = [
          ...section.leftLanes,
          section.centerLane,
          ...section.rightLanes,
        ];

        for (const lane of allLanes) {
          for (const roadMark of lane.roadMarks) {
            if (roadMark.type !== 'none') {
              marks.push(
                buildRoadMarkMesh(road, section, lane, roadMark, sValues),
              );
            }
          }
        }
      }
      return marks;
    }, [road, showRoadMarks]);

    return (
      <group>
        {/* Lane surface meshes */}
        {roadMeshData.laneSections.map((section, sIdx) =>
          section.lanes.map((lane) => (
            <LaneMesh
              key={`s${sIdx}-l${lane.laneId}`}
              laneMesh={lane}
            />
          )),
        )}

        {/* Road markings */}
        {roadMarkMeshes.map((mark, idx) => (
          <RoadMarkLine key={`mark-${idx}`} markMesh={mark} />
        ))}
      </group>
    );
  },
);

RoadMesh.displayName = 'RoadMesh';
