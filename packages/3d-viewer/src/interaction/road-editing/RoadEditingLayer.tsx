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
import { RoadCreationTool } from './RoadCreationTool.js';
import { SnapIndicator } from './SnapIndicator.js';
import { ArcCurvatureHandle } from './ArcCurvatureHandle.js';

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
  /** Whether road creation mode is active */
  creationModeActive?: boolean;
  /** Callback when user clicks to create a road */
  onCreateRoad?: (x: number, y: number, hdg: number) => void;
  /** Whether grid snap is enabled */
  gridSnap?: boolean;
  /** Callback when a tangent handle is dragged to change heading */
  onHeadingDragEnd?: (roadId: string, geometryIndex: number, newHdg: number) => void;
  /** Callback when arc curvature is changed via drag */
  onCurvatureDragEnd?: (roadId: string, geometryIndex: number, newCurvature: number) => void;
}

export function RoadEditingLayer({
  openDriveDocument,
  selectedRoadId,
  onGeometryDragEnd,
  onGeometrySelect,
  selectedGeometryIndex,
  orbitControlsRef,
  creationModeActive = false,
  onCreateRoad,
  gridSnap = false,
  onHeadingDragEnd,
  onCurvatureDragEnd,
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

  const handleHeadingDragEnd = useCallback(
    (index: number, newHdg: number) => {
      if (selectedRoadId) {
        onHeadingDragEnd?.(selectedRoadId, index, newHdg);
      }
    },
    [selectedRoadId, onHeadingDragEnd],
  );

  const handleCurvatureDragEnd = useCallback(
    (index: number, newCurvature: number) => {
      if (selectedRoadId) {
        onCurvatureDragEnd?.(selectedRoadId, index, newCurvature);
      }
    },
    [selectedRoadId, onCurvatureDragEnd],
  );

  return (
    <group>
      {/* Road creation tool (invisible ground plane for click-to-create) */}
      {creationModeActive && onCreateRoad && (
        <RoadCreationTool
          active={creationModeActive}
          openDriveDocument={openDriveDocument}
          onCreateRoad={onCreateRoad}
          gridSnap={gridSnap}
        />
      )}

      {/* Snap target indicators (show endpoints of other roads) */}
      <SnapIndicator
        openDriveDocument={openDriveDocument}
        excludeRoadId={selectedRoadId}
        visible={creationModeActive || selectedRoad != null}
      />

      {/* Selected road: control points + tangent handles */}
      {selectedRoad && (
        <>
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
                index={i}
                selected={selectedGeometryIndex === i}
                onHeadingChange={handleHeadingDragEnd}
                orbitControlsRef={orbitControlsRef}
              />
              <ArcCurvatureHandle
                geometry={geometry}
                index={i}
                selected={selectedGeometryIndex === i}
                onCurvatureChange={handleCurvatureDragEnd}
                orbitControlsRef={orbitControlsRef}
              />
            </React.Fragment>
          ))}

          {/* Road endpoint markers (start + end) */}
          <RoadEndpointMarkers road={selectedRoad} />
        </>
      )}

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
