/**
 * Top-level component for rendering the entire road network.
 * Orchestrates mesh generation and coordinate system transformation.
 *
 * OpenDRIVE coordinate system: x/y ground plane, z up
 * Three.js coordinate system: x/z ground plane, y up
 * This component applies a rotation to map between them.
 */

import React, { useMemo, forwardRef } from 'react';
import type * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { generateRoadMesh, buildJunctionSurfaceMesh } from '@osce/opendrive';
import type { JunctionSurfaceData } from '@osce/opendrive';
import { RoadMesh } from './RoadMesh.js';
import { RoadLabels } from './RoadLabels.js';
import { JunctionMesh } from './JunctionMesh.js';
import { LaneHighlightManager } from './LaneHighlightManager.js';

interface RoadNetworkProps {
  odrDocument: OpenDriveDocument | null;
  showRoadMarks?: boolean;
  showRoadIds?: boolean;
  showLaneIds?: boolean;
  /** Ref-based lane highlight for hover feedback (read in useFrame, no re-renders) */
  highlightedLaneRef?: React.RefObject<{ roadId: string; laneId: number } | null>;
}

export const RoadNetwork = forwardRef<THREE.Group, RoadNetworkProps>(
  function RoadNetwork(
    {
      odrDocument,
      showRoadMarks = true,
      showRoadIds = false,
      showLaneIds = false,
      highlightedLaneRef,
    },
    ref,
  ) {
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
      <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
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
        <LaneHighlightManager highlightedLaneRef={highlightedLaneRef} />
      </group>
    );
  },
);

RoadNetwork.displayName = 'RoadNetwork';
