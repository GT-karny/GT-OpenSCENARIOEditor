/**
 * Orchestrator for road geometry editing in 3D.
 * Renders control point gizmos and tangent handles for the selected road.
 * Placed inside the OpenDRIVE rotation group in ScenarioViewerScene.
 */

import React, { useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { ControlPointGizmo } from './ControlPointGizmo.js';
import { TangentHandle } from './TangentHandle.js';
import { RoadEndpointMarkers } from './RoadEndpointMarkers.js';
import { RoadCreationInteraction } from './RoadCreationInteraction.js';
import { RoadGhostPreview } from './RoadGhostPreview.js';
import { SnapIndicator } from './SnapIndicator.js';
import { ArcCurvatureHandle } from './ArcCurvatureHandle.js';
import { EndPointGizmo } from './EndPointGizmo.js';
import { RoadLinkLines } from './RoadLinkLines.js';
import { RoadSelectHandler } from './RoadSelectHandler.js';

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
  /** Current creation phase */
  creationPhase?: 'idle' | 'startPlaced';
  /** Start position (valid when creationPhase === 'startPlaced') */
  creationStartX?: number;
  creationStartY?: number;
  creationStartHdg?: number;
  /** Cursor position for ghost preview */
  creationCursorX?: number;
  creationCursorY?: number;
  /** Lane sections for ghost preview */
  creationLanes?: import('@osce/shared').OdrLaneSection[];
  /** Callback when user clicks to place start point */
  onCreationStartPlace?: (
    x: number,
    y: number,
    hdg: number,
    snap?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  /** Callback when user clicks to create a road (2-point) */
  onRoadCreate?: (
    startX: number,
    startY: number,
    startHdg: number,
    endX: number,
    endY: number,
    curvature: number,
    snapInfo?: { roadId: string; contactPoint: 'start' | 'end' },
  ) => void;
  /** Callback to update cursor position during creation */
  onCreationCursorMove?: (x: number, y: number) => void;
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
  /** Whether road creation has a heading constraint at start */
  creationHasStartConstraint?: boolean;
  /** Whether select mode is active (click road meshes to select) */
  selectModeActive?: boolean;
  /** Ref to the road network group (for raycast selection) */
  roadGroupRef?: React.RefObject<THREE.Group | null>;
  /** Callback when a road is selected via click */
  onRoadSelect?: (roadId: string) => void;
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
  creationPhase = 'idle',
  creationStartX = 0,
  creationStartY = 0,
  creationStartHdg = 0,
  creationCursorX = 0,
  creationCursorY = 0,
  creationLanes,
  onCreationStartPlace,
  onRoadCreate,
  onCreationCursorMove,
  gridSnap = false,
  onHeadingDragEnd,
  onCurvatureDragEnd,
  onEndpointDragEnd,
  onGeometryShiftClick,
  selectedGeometryIndices,
  onRoadLinkSet,
  onRoadLinkUnset,
  onEndpointContextMenu,
  creationHasStartConstraint = false,
  selectModeActive = false,
  roadGroupRef,
  onRoadSelect,
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
      {/* Road mesh click selection (raycast-based) */}
      {selectModeActive && roadGroupRef && onRoadSelect && (
        <RoadSelectHandler
          active={selectModeActive}
          roadGroupRef={roadGroupRef}
          onRoadSelect={onRoadSelect}
        />
      )}

      {/* Road link connection lines */}
      <RoadLinkLines openDriveDocument={openDriveDocument} />

      {/* Road creation interaction (2-point click-to-create) */}
      {creationModeActive && onCreationStartPlace && onRoadCreate && (
        <RoadCreationInteraction
          active={creationModeActive}
          phase={creationPhase}
          startX={creationStartX}
          startY={creationStartY}
          startHdg={creationStartHdg}
          hasStartConstraint={creationHasStartConstraint}
          openDriveDocument={openDriveDocument}
          onStartPlace={onCreationStartPlace}
          onRoadCreate={onRoadCreate}
          onCursorMove={onCreationCursorMove}
          gridSnap={gridSnap}
        />
      )}

      {/* Ghost preview during road creation */}
      {creationModeActive && creationPhase === 'startPlaced' && creationLanes && (
        <RoadGhostPreview
          startX={creationStartX}
          startY={creationStartY}
          startHdg={creationStartHdg}
          endX={creationCursorX}
          endY={creationCursorY}
          lanes={creationLanes}
          headingConstrained={creationHasStartConstraint}
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
