/**
 * Top-level component for rendering the entire road network.
 * Orchestrates mesh generation and coordinate system transformation.
 *
 * OpenDRIVE coordinate system: x/y ground plane, z up
 * Three.js coordinate system: x/z ground plane, y up
 * This component applies a rotation to map between them.
 */

import React, { useMemo, useRef, forwardRef } from 'react';
import type * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { OpenDriveDocument, OdrRoad, RoadMeshData } from '@osce/shared';
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
  /** Currently selected junction ID (renders with highlight) */
  selectedJunctionId?: string | null;
  /** Ghost junction surface to preview during auto-detection */
  ghostJunctionSurface?: JunctionSurfaceData | null;
  /** Callback when a junction surface is clicked */
  onJunctionClick?: (junctionId: string) => void;
  /** Callback when a junction surface is right-clicked */
  onJunctionContextMenu?: (junctionId: string, event: ThreeEvent<MouseEvent>) => void;
}

export const RoadNetwork = forwardRef<THREE.Group, RoadNetworkProps>(
  function RoadNetwork(
    {
      odrDocument,
      showRoadMarks = true,
      showRoadIds = false,
      showLaneIds = false,
      highlightedLaneRef,
      selectedJunctionId,
      ghostJunctionSurface,
      onJunctionClick,
      onJunctionContextMenu,
    },
    ref,
  ) {
    // Per-road mesh cache: only regenerate meshes for roads that changed.
    // Uses immer reference identity — unchanged roads keep the same object reference.
    const meshCacheRef = useRef<Map<string, { road: OdrRoad; meshData: RoadMeshData }>>(new Map());

    const roadMeshes = useMemo(() => {
      if (!odrDocument) {
        meshCacheRef.current.clear();
        return [];
      }

      const cache = meshCacheRef.current;
      const currentRoadIds = new Set(odrDocument.roads.map((r) => r.id));

      // Remove cached entries for deleted roads
      for (const id of cache.keys()) {
        if (!currentRoadIds.has(id)) cache.delete(id);
      }

      // Build mesh list, reusing cache where road reference is unchanged
      return odrDocument.roads.map((road) => {
        const cached = cache.get(road.id);
        if (cached && cached.road === road) {
          return { road, meshData: cached.meshData };
        }
        // Road changed or is new — regenerate mesh
        const meshData = generateRoadMesh(road);
        cache.set(road.id, { road, meshData });
        return { road, meshData };
      });
    }, [odrDocument]);

    // Per-junction surface cache
    const junctionCacheRef = useRef<Map<string, { junction: unknown; surface: JunctionSurfaceData }>>(new Map());

    const junctionSurfaces = useMemo(() => {
      if (!odrDocument) {
        junctionCacheRef.current.clear();
        return [];
      }

      const cache = junctionCacheRef.current;
      const currentIds = new Set(odrDocument.junctions.map((j) => j.id));

      for (const id of cache.keys()) {
        if (!currentIds.has(id)) cache.delete(id);
      }

      const surfaces: JunctionSurfaceData[] = [];
      for (const junction of odrDocument.junctions) {
        const cached = cache.get(junction.id);
        if (cached && cached.junction === junction) {
          surfaces.push(cached.surface);
          continue;
        }
        const surface = buildJunctionSurfaceMesh(junction, odrDocument.roads);
        if (surface) {
          cache.set(junction.id, { junction, surface });
          surfaces.push(surface);
        }
      }
      return surfaces;
    }, [odrDocument]);

    if (!odrDocument || roadMeshes.length === 0) return null;

    return (
      <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        {roadMeshes.map(({ road, meshData }) => (
          <group key={road.id} userData={{ roadId: road.id }}>
            <RoadMesh
              road={road}
              roadMeshData={meshData}
              showRoadMarks={showRoadMarks}
            />
          </group>
        ))}
        {/* Junction surface fills (rendered behind roads via polygonOffset) */}
        {junctionSurfaces.map((surface) => (
          <JunctionMesh
            key={`junc-${surface.junctionId}`}
            surface={surface}
            selected={selectedJunctionId === surface.junctionId}
            onClick={onJunctionClick}
            onContextMenu={onJunctionContextMenu}
          />
        ))}
        {/* Ghost junction preview during auto-detection */}
        {ghostJunctionSurface && (
          <JunctionMesh
            key={`ghost-${ghostJunctionSurface.junctionId}`}
            surface={ghostJunctionSurface}
            ghost
          />
        )}
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
