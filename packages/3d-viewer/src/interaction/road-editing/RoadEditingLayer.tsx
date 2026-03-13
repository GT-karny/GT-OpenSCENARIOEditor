/**
 * Orchestrator for road geometry editing in 3D.
 * Renders control point gizmos and tangent handles for the selected road.
 * Placed inside the OpenDRIVE rotation group in ScenarioViewerScene.
 */

import React, { useCallback, useMemo } from 'react';
import type { OpenDriveDocument } from '@osce/shared';
import { ControlPointGizmo } from './ControlPointGizmo.js';
import { TangentHandle } from './TangentHandle.js';
import { RoadEndpointMarkers } from './RoadEndpointMarkers.js';

interface RoadEditingLayerProps {
  /** Full OpenDRIVE document */
  openDriveDocument: OpenDriveDocument;
  /** Currently selected road ID */
  selectedRoadId: string | null;
  /** Callback when a geometry control point is dragged to a new position */
  onGeometryDragEnd?: (roadId: string, geometryIndex: number, newX: number, newY: number) => void;
  /** Callback when a geometry control point is selected */
  onGeometrySelect?: (roadId: string, geometryIndex: number) => void;
  /** Currently selected geometry index */
  selectedGeometryIndex?: number | null;
  /** Ref to OrbitControls */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>;
}

export function RoadEditingLayer({
  openDriveDocument,
  selectedRoadId,
  onGeometryDragEnd,
  onGeometrySelect,
  selectedGeometryIndex,
  orbitControlsRef,
}: RoadEditingLayerProps) {
  const selectedRoad = useMemo(
    () => openDriveDocument.roads.find((r) => r.id === selectedRoadId) ?? null,
    [openDriveDocument.roads, selectedRoadId],
  );

  const handleControlPointClick = useCallback(
    (index: number) => {
      if (selectedRoadId) {
        onGeometrySelect?.(selectedRoadId, index);
      }
    },
    [selectedRoadId, onGeometrySelect],
  );

  const handleControlPointDragEnd = useCallback(
    (index: number, newX: number, newY: number) => {
      if (selectedRoadId) {
        onGeometryDragEnd?.(selectedRoadId, index, newX, newY);
      }
    },
    [selectedRoadId, onGeometryDragEnd],
  );

  if (!selectedRoad) return null;

  return (
    <group>
      {/* Control points at each geometry segment start */}
      {selectedRoad.planView.map((geometry, i) => (
        <React.Fragment key={`cp-${i}`}>
          <ControlPointGizmo
            geometry={geometry}
            index={i}
            selected={selectedGeometryIndex === i}
            onClick={handleControlPointClick}
            onDragEnd={handleControlPointDragEnd}
            orbitControlsRef={orbitControlsRef}
          />
          <TangentHandle
            geometry={geometry}
            selected={selectedGeometryIndex === i}
          />
        </React.Fragment>
      ))}

      {/* Road endpoint markers (start + end) */}
      <RoadEndpointMarkers road={selectedRoad} />

      {/* Unselected roads: faint control point markers for context */}
      {openDriveDocument.roads
        .filter((r) => r.id !== selectedRoadId)
        .map((road) =>
          road.planView.map((geometry, i) => (
            <mesh
              key={`ctx-${road.id}-${i}`}
              position={[geometry.x, geometry.y, 0]}
            >
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial color="#444" transparent opacity={0.3} />
            </mesh>
          )),
        )}
    </group>
  );
}
