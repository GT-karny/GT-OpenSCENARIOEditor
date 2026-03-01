/**
 * Top-level component for rendering the entire road network.
 * Orchestrates mesh generation and coordinate system transformation.
 *
 * OpenDRIVE coordinate system: x/y ground plane, z up
 * Three.js coordinate system: x/z ground plane, y up
 * This component applies a rotation to map between them.
 */

import React, { useMemo } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { generateRoadMesh, buildJunctionSurfaceMesh } from '@osce/opendrive';
import type { JunctionSurfaceData } from '@osce/opendrive';
import { RoadMesh } from './RoadMesh.js';
import { RoadLabels } from './RoadLabels.js';
import { JunctionMesh } from './JunctionMesh.js';

interface RoadNetworkProps {
  odrDocument: OpenDriveDocument | null;
  showRoadMarks?: boolean;
  showRoadIds?: boolean;
  showLaneIds?: boolean;
}

export const RoadNetwork: React.FC<RoadNetworkProps> = React.memo(
  ({
    odrDocument,
    showRoadMarks = true,
    showRoadIds = false,
    showLaneIds = false,
  }) => {
    // Generate mesh data for all roads
    const roadMeshes = useMemo(() => {
      if (!odrDocument) return [];
      return odrDocument.roads.map((road) => ({
        road,
        meshData: generateRoadMesh(road),
      }));
    }, [odrDocument]);

    // Generate junction surface fill meshes
    const junctionSurfaces = useMemo(() => {
      if (!odrDocument) return [];
      const surfaces: JunctionSurfaceData[] = [];
      for (const junction of odrDocument.junctions) {
        const surface = buildJunctionSurfaceMesh(junction, odrDocument.roads);
        if (surface) surfaces.push(surface);
      }
      return surfaces;
    }, [odrDocument]);

    if (!odrDocument || roadMeshes.length === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {roadMeshes.map(({ road, meshData }) => (
          <RoadMesh
            key={road.id}
            road={road}
            roadMeshData={meshData}
            showRoadMarks={showRoadMarks}
          />
        ))}
        {/* Junction surface fills (rendered behind roads via polygonOffset) */}
        {junctionSurfaces.map((surface) => (
          <JunctionMesh key={`junc-${surface.junctionId}`} surface={surface} />
        ))}
        <RoadLabels
          roads={odrDocument.roads}
          showRoadIds={showRoadIds}
          showLaneIds={showLaneIds}
        />
      </group>
    );
  },
);

RoadNetwork.displayName = 'RoadNetwork';
