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
import { EndPointGizmo } from './EndPointGizmo.js';
import { RoadLinkLines } from './RoadLinkLines.js';

interface RoadEditingLayerProps {
  /** Full OpenDRIVE document */
  openDriveDocument: OpenDriveDocument;
  /** Currently selected road ID */
  selectedRoadId: string | null;
  /** Callback when a control point is Ctrl+dragged (translate: only x,y change) */
  onGeometryDragEnd?: (roadId: string, geometryIndex: number, newX: number, newY: number) => void;
  /** Callback when a start point is dragged to reshape (keep endpoint fixed) */
  onStartpointDragEnd?: (
    roadId: string,
    geometryIndex: number,
    updates: { x: number; y: number; hdg: number; length: number; curvature?: number },
  ) => void;
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
  /** Callback when an endpoint gizmo is dragged to reshape geometry */
  onEndpointDragEnd?: (
    roadId: string,
    geometryIndex: number,
    updates: { hdg?: number; length: number; curvature?: number },
  ) => void;
  /** Callback when a geometry point is Shift+clicked for multi-selection */
  onGeometryShiftClick?: (roadId: string, geometryIndex: number) => void;
  /** Set of selected geometry indices (for multi-selection highlight) */
  selectedGeometryIndices?: Set<number>;
  /** Callback when a road endpoint snaps to another road's endpoint */
  onRoadLinkSet?: (
    roadId: string,
    linkType: 'predecessor' | 'successor',
    targetRoadId: string,
    targetContactPoint: 'start' | 'end',
  ) => void;
  /** Callback when a road endpoint is unsnapped (dragged away from connection) */
  onRoadLinkUnset?: (roadId: string, linkType: 'predecessor' | 'successor') => void;
  /** Callback when endpoint is right-clicked */
  onEndpointContextMenu?: (
    roadId: string,
    contactPoint: 'start' | 'end',
    screenX: number,
    screenY: number,
  ) => void;
}

export function RoadEditingLayer({
  openDriveDocument,
  selectedRoadId,
  onGeometryDragEnd,
  onStartpointDragEnd,
  onGeometrySelect,
  selectedGeometryIndex,
  orbitControlsRef,
  creationModeActive = false,
  onCreateRoad,
  gridSnap = false,
  onHeadingDragEnd,
  onCurvatureDragEnd,
  onEndpointDragEnd,
  onGeometryShiftClick,
  selectedGeometryIndices,
  onRoadLinkSet,
  onRoadLinkUnset,
  onEndpointContextMenu,
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

  // Ctrl+drag on start or end point: translate (just move x,y)
  const handleTranslateDragEnd = useCallback(
    (index: number, newX: number, newY: number) => {
      if (selectedRoadId) {
        onGeometryDragEnd?.(selectedRoadId, index, newX, newY);
      }
    },
    [selectedRoadId, onGeometryDragEnd],
  );

  // Normal drag on start point: reshape from start (keep endpoint fixed)
  const handleStartpointDragEnd = useCallback(
    (
      index: number,
      updates: { x: number; y: number; hdg: number; length: number; curvature?: number },
    ) => {
      if (selectedRoadId) {
        onStartpointDragEnd?.(selectedRoadId, index, updates);
      }
    },
    [selectedRoadId, onStartpointDragEnd],
  );

  const handleHeadingDragEnd = useCallback(
    (index: number, newHdg: number) => {
      if (selectedRoadId) {
        onHeadingDragEnd?.(selectedRoadId, index, newHdg);
      }
    },
    [selectedRoadId, onHeadingDragEnd],
  );

  const handleShiftClick = useCallback(
    (index: number) => {
      if (selectedRoadId) {
        onGeometryShiftClick?.(selectedRoadId, index);
      }
    },
    [selectedRoadId, onGeometryShiftClick],
  );

  const handleCurvatureDragEnd = useCallback(
    (index: number, newCurvature: number) => {
      if (selectedRoadId) {
        onCurvatureDragEnd?.(selectedRoadId, index, newCurvature);
      }
    },
    [selectedRoadId, onCurvatureDragEnd],
  );

  const handleEndpointDragEnd = useCallback(
    (index: number, updates: { hdg?: number; length: number; curvature?: number }) => {
      if (selectedRoadId) {
        onEndpointDragEnd?.(selectedRoadId, index, updates);
      }
    },
    [selectedRoadId, onEndpointDragEnd],
  );

  const handleSnapLink = useCallback(
    (
      roadId: string,
      linkType: 'predecessor' | 'successor',
      targetRoadId: string,
      targetContactPoint: 'start' | 'end',
    ) => {
      onRoadLinkSet?.(roadId, linkType, targetRoadId, targetContactPoint);
    },
    [onRoadLinkSet],
  );

  const handleSnapUnlink = useCallback(
    (roadId: string, linkType: 'predecessor' | 'successor') => {
      onRoadLinkUnset?.(roadId, linkType);
    },
    [onRoadLinkUnset],
  );

  const handleEndpointContextMenu = useCallback(
    (contactPoint: 'start' | 'end', screenX: number, screenY: number) => {
      if (selectedRoadId) {
        onEndpointContextMenu?.(selectedRoadId, contactPoint, screenX, screenY);
      }
    },
    [selectedRoadId, onEndpointContextMenu],
  );

  return (
    <group>
      {/* Road link connection lines */}
      <RoadLinkLines openDriveDocument={openDriveDocument} />

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
                selected={selectedGeometryIndices ? selectedGeometryIndices.has(i) : selectedGeometryIndex === i}
                onClick={handleControlPointClick}
                onShiftClick={handleShiftClick}
                onDragEnd={handleStartpointDragEnd}
                onTranslateDragEnd={handleTranslateDragEnd}
                orbitControlsRef={orbitControlsRef}
                openDriveDocument={openDriveDocument}
                roadId={selectedRoadId!}
                onSnapLink={handleSnapLink}
                onSnapUnlink={handleSnapUnlink}
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
              <EndPointGizmo
                geometry={geometry}
                index={i}
                selected={selectedGeometryIndices ? selectedGeometryIndices.has(i) : selectedGeometryIndex === i}
                onDragEnd={handleEndpointDragEnd}
                onTranslateDragEnd={handleTranslateDragEnd}
                orbitControlsRef={orbitControlsRef}
                openDriveDocument={openDriveDocument}
                roadId={selectedRoadId!}
                isLastGeometry={i === selectedRoad.planView.length - 1}
                onSnapLink={handleSnapLink}
                onSnapUnlink={handleSnapUnlink}
              />
            </React.Fragment>
          ))}

          {/* Road endpoint markers (start + end) */}
          <RoadEndpointMarkers
            road={selectedRoad}
            onEndpointContextMenu={handleEndpointContextMenu}
          />
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
