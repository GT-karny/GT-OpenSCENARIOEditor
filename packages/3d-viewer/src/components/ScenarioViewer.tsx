/**
 * Main public component: 3D scenario viewer.
 * Wires together road rendering, entity display, camera controls,
 * scenario store subscription, and simulation playback.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import type * as THREE from 'three';
import { Vector3 } from 'three';
import type {
  OpenDriveDocument,
  SimulationFrame,
  SimulationStatus,
  EditorPreferences,
  ScenarioDocument,
  Route,
} from '@osce/shared';
import { createViewerStore, useViewerStore } from '../store/viewer-store.js';
import type { HoverLaneInfo, ViewerMode } from '../store/viewer-types.js';
import { ViewerCanvas } from '../scene/ViewerCanvas.js';
import { SceneEnvironment } from '../scene/SceneEnvironment.js';
import { CameraController } from '../scene/CameraController.js';
import type { CameraControllerHandle } from '../scene/CameraController.js';
import { RoadNetwork } from '../road/RoadNetwork.js';
import { EntityGroup } from '../entities/EntityGroup.js';
import { RoadClickHandler } from '../interaction/RoadClickHandler.js';
import type { PickedPositionData } from '../interaction/RoadClickHandler.js';
import { PlacementOverlay } from '../interaction/PlacementOverlay.js';
import { PositionInspectorOverlay } from '../interaction/PositionInspectorOverlay.js';
import { ViewerToolbar } from './ViewerToolbar.js';
import { useScenarioEntities } from '../scenario/useScenarioEntities.js';
import { useEntityPositions } from '../scenario/useEntityPositions.js';
import { SimulationOverlay } from '../scenario/SimulationOverlay.js';
import { useCameraFollow } from '../scene/useCameraFollow.js';
import { Minimap } from './Minimap.js';
import { RouteOverlay } from '../route/RouteOverlay.js';
import { RoutePreviewOverlay } from '../route/RoutePreviewOverlay.js';
import type { RoutePreviewData } from '../route/RoutePreviewOverlay.js';
import { RouteClickHandler } from '../interaction/RouteClickHandler.js';
import { RouteEditOverlay } from '../route/RouteEditOverlay.js';
import { TrafficSignalGroup } from '../signals/TrafficSignalGroup.js';
import { useScenarioPositions } from '../scenario/useScenarioPositions.js';
import { PositionMarkersOverlay } from '../markers/PositionMarkersOverlay.js';
import type { ThreeEvent } from '@react-three/fiber';
import { RoadEditingLayer } from '../interaction/road-editing/RoadEditingLayer.js';

export interface ScenarioViewerProps {
  /** The scenario engine Zustand store (vanilla) */
  scenarioStore: ReturnType<typeof import('@osce/scenario-engine').createScenarioStore>;
  /** Parsed OpenDRIVE document for road rendering */
  openDriveDocument: OpenDriveDocument | null;
  /** Currently selected entity ID (controlled externally) */
  selectedEntityId?: string | null;
  /** Entity name to highlight on hover (from composer card) */
  hoveredEntityName?: string | null;
  /** Callback when user clicks an entity in the viewer */
  onEntitySelect?: (entityId: string) => void;
  /** Callback when user double-clicks an entity (request focus) */
  onEntityFocus?: (entityId: string) => void;
  /** Callback when entity position is changed via gizmo drag or click placement */
  onEntityPositionChange?: (
    entityName: string,
    x: number,
    y: number,
    z: number,
    h: number,
    forceWorldPosition?: boolean,
  ) => void;
  /** Current simulation frame to display (null = show init positions) */
  currentFrame?: SimulationFrame | null;
  /** Simulation status for auto-mode-switching */
  simulationStatus?: SimulationStatus;
  /** Editor preferences for display toggles */
  preferences?: Partial<EditorPreferences>;
  /** CSS class for the container */
  className?: string;
  /** Callback when the viewer mode changes (edit/play) */
  onViewerModeChange?: (mode: ViewerMode) => void;
  /** CSS style for the container */
  style?: React.CSSProperties;
  /** Entity ID to focus camera on (from external panel double-click) */
  focusEntityId?: string | null;
  /** Whether route editing mode is active */
  routeEditActive?: boolean;
  /** Waypoints in OpenDRIVE coordinates */
  routeWaypoints?: Array<{ x: number; y: number; z: number; h: number }>;
  /** Path segments (interpolated points between waypoints) */
  routePathSegments?: Array<Array<{ x: number; y: number; z: number }>>;
  /** Currently selected waypoint index */
  routeSelectedWaypointIndex?: number | null;
  /** Callback when user clicks a waypoint marker */
  onRouteWaypointClick?: (index: number) => void;
  /** Callback when user right-clicks a waypoint marker */
  onRouteWaypointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  /** Callback when user clicks a route line segment */
  onRouteLineClick?: (segmentIndex: number, event: ThreeEvent<MouseEvent>) => void;
  /** Callback when user clicks road surface to add a waypoint */
  onRouteWaypointAdd?: (
    worldX: number, worldY: number, worldZ: number, heading: number,
    roadId: string, laneId: string, s: number, offset: number,
  ) => void;
  /** Callback when user drags a waypoint to a new position */
  onRouteWaypointDragEnd?: (
    index: number,
    worldX: number, worldY: number, worldZ: number, heading: number,
    roadId: string, laneId: string, s: number, offset: number,
  ) => void;
  /** Callback to save and exit route editing */
  onRouteEditSave?: () => void;
  /** Callback to cancel route editing */
  onRouteEditCancel?: () => void;
  /** Warnings from route validation */
  routeWarnings?: string[];
  /** Number of waypoints in the editing route */
  routeWaypointCount?: number;
  /** Resolve a catalog reference to a Route definition (for RoutePosition placement) */
  resolveCatalogRoute?: (ref: { catalogName: string; entryName: string }) => Route | null;
  /** Route preview data for selected entity/action (read-only visualization) */
  routePreviewData?: RoutePreviewData[];
  /** Currently selected traffic signal key (roadId:signalId) */
  selectedSignalKey?: string | null;
  /** Callback when user clicks a traffic signal in the viewer */
  onSignalSelect?: (key: string) => void;
  /** Show r3f-perf overlay for performance monitoring */
  showPerf?: boolean;
  /** Whether position pick mode is active */
  positionPickActive?: boolean;
  /** Callback when a position is picked from the 3D viewer */
  onPositionPicked?: (data: PickedPositionData) => void;
  /** Callback when pick mode is cancelled (Escape key) */
  onPositionPickCancel?: () => void;
  /** Element IDs to highlight their associated position markers */
  highlightedPositionElementIds?: string[];

  // ---- Road Network Editing ----
  /** Whether road geometry editing mode is active */
  roadEditMode?: boolean;
  /** Currently selected road ID for editing */
  roadEditSelectedRoadId?: string | null;
  /** Currently selected geometry index */
  roadEditSelectedGeometryIndex?: number | null;
  /** Callback when a geometry control point is dragged to a new position */
  onRoadGeometryDragEnd?: (
    roadId: string,
    geometryIndex: number,
    newX: number,
    newY: number,
  ) => void;
  /** Callback when a geometry control point is selected */
  onRoadGeometrySelect?: (roadId: string, geometryIndex: number) => void;
}

/**
 * Inner component that lives inside the R3F Canvas.
 */
function ScenarioViewerScene({
  scenarioStore,
  openDriveDocument,
  selectedEntityId,
  hoveredEntityName,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame,
  viewerStore,
  focusEntityId,
  cameraStateRef,
  routeEditActive,
  routeWaypoints,
  routePathSegments,
  routeSelectedWaypointIndex,
  onRouteWaypointClick,
  onRouteWaypointContextMenu,
  onRouteLineClick,
  onRouteWaypointAdd,
  onRouteWaypointDragEnd,
  resolveCatalogRoute,
  routePreviewData,
  selectedSignalKey,
  onSignalSelect,
  positionPickActive,
  onPositionPicked,
  onPositionPickCancel,
  highlightedPositionElementIds,
  roadEditMode,
  roadEditSelectedRoadId,
  roadEditSelectedGeometryIndex,
  onRoadGeometryDragEnd,
  onRoadGeometrySelect,
}: {
  scenarioStore: ScenarioViewerProps['scenarioStore'];
  openDriveDocument: OpenDriveDocument | null;
  selectedEntityId: string | null;
  hoveredEntityName?: string | null;
  onEntitySelect: (entityId: string) => void;
  onEntityFocus: (entityId: string) => void;
  onEntityPositionChange?: ScenarioViewerProps['onEntityPositionChange'];
  currentFrame?: SimulationFrame | null;
  viewerStore: ReturnType<typeof createViewerStore>;
  focusEntityId?: string | null;
  cameraStateRef?: React.RefObject<{ position: THREE.Vector3; target: THREE.Vector3 }>;
  routeEditActive?: boolean;
  routeWaypoints?: Array<{ x: number; y: number; z: number; h: number }>;
  routePathSegments?: Array<Array<{ x: number; y: number; z: number }>>;
  routeSelectedWaypointIndex?: number | null;
  onRouteWaypointClick?: (index: number) => void;
  onRouteWaypointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  onRouteLineClick?: (segmentIndex: number, event: ThreeEvent<MouseEvent>) => void;
  onRouteWaypointAdd?: ScenarioViewerProps['onRouteWaypointAdd'];
  onRouteWaypointDragEnd?: ScenarioViewerProps['onRouteWaypointDragEnd'];
  resolveCatalogRoute?: ScenarioViewerProps['resolveCatalogRoute'];
  routePreviewData?: RoutePreviewData[];
  selectedSignalKey?: string | null;
  onSignalSelect?: (key: string) => void;
  positionPickActive?: boolean;
  onPositionPicked?: (data: PickedPositionData) => void;
  onPositionPickCancel?: () => void;
  highlightedPositionElementIds?: string[];
  roadEditMode?: boolean;
  roadEditSelectedRoadId?: string | null;
  roadEditSelectedGeometryIndex?: number | null;
  onRoadGeometryDragEnd?: ScenarioViewerProps['onRoadGeometryDragEnd'];
  onRoadGeometrySelect?: ScenarioViewerProps['onRoadGeometrySelect'];
}) {
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const showTrafficSignals = useViewerStore(viewerStore, (s) => s.showTrafficSignals);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const viewerMode = useViewerStore(viewerStore, (s) => s.viewerMode);
  const snapToLane = useViewerStore(viewerStore, (s) => s.snapToLane);
  const reverseDirection = useViewerStore(viewerStore, (s) => s.reverseDirection);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  const resolveOptions = useMemo(
    () => (resolveCatalogRoute ? { resolveCatalogRoute } : undefined),
    [resolveCatalogRoute],
  );

  const showPositionMarkers = useViewerStore(viewerStore, (s) => s.showPositionMarkers);

  const entities = useScenarioEntities(scenarioStore);
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument, resolveOptions);
  const scenarioPositions = useScenarioPositions(scenarioStore, openDriveDocument, resolveOptions);

  const isSimulating = currentFrame != null;
  const isEditMode = viewerMode === 'edit';
  const showSimulation = isSimulating && !isEditMode;

  // In play mode, force gizmo off and disable position changes
  const effectiveGizmoMode = isEditMode ? gizmoMode : 'off';
  const effectiveOnPositionChange = isEditMode ? onEntityPositionChange : undefined;

  // Extract selected entity's road position for road-coordinate gizmo
  const initEntityActions = useStore(
    scenarioStore,
    (state: { document: ScenarioDocument }) => state.document.storyboard.init.entityActions,
  );

  const selectedEntityRoadPosition = useMemo(() => {
    if (!selectedEntityId) return null;
    const selectedEntity = entities.find((e) => e.id === selectedEntityId);
    if (!selectedEntity) return null;

    const ea = initEntityActions.find((a) => a.entityRef === selectedEntity.name);
    if (!ea) return null;

    for (const pa of ea.privateActions) {
      if (pa.action.type === 'teleportAction' && pa.action.position.type === 'lanePosition') {
        const pos = pa.action.position;
        return {
          roadId: pos.roadId,
          laneId: parseInt(pos.laneId, 10),
          s: pos.s,
        };
      }
    }
    return null;
  }, [selectedEntityId, entities, initEntityActions]);

  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);
  const cameraRef = useRef<CameraControllerHandle>(null);
  const roadGroupRef = useRef<THREE.Group>(null);
  const highlightedLaneRef = useRef<{ roadId: string; laneId: number } | null>(null);

  // Camera follow (only active during simulation)
  useCameraFollow({
    targetEntity: followTargetEntity,
    orbitControlsRef: cameraRef.current?.orbitControls ?? { current: null },
    entityPositions,
    currentFrame,
    isSimulating,
  });

  const handleEntityFocus = useCallback(
    (entityId: string) => {
      onEntityFocus(entityId);
      // Find entity position and set as camera focus target
      const entity = entities.find((e) => e.id === entityId);
      if (entity) {
        const pos = entityPositions.get(entity.name);
        if (pos) {
          // Convert to Three.js coords (after the rotation group transform)
          setFocusTarget([pos.x, pos.z, -pos.y]);
        }
      }
    },
    [entities, entityPositions, onEntityFocus],
  );

  // Handle placement from RoadClickHandler
  const handlePlacement = useCallback(
    (x: number, y: number, z: number, h: number, forceWorldPosition: boolean) => {
      if (!selectedEntityId || !onEntityPositionChange) return;
      const selectedEntity = entities.find((e) => e.id === selectedEntityId);
      if (!selectedEntity) return;
      onEntityPositionChange(selectedEntity.name, x, y, z, h, forceWorldPosition);
    },
    [selectedEntityId, entities, onEntityPositionChange],
  );

  const handleHoverLaneChange = useCallback(
    (info: HoverLaneInfo | null) => {
      viewerStore.getState().setHoverLaneInfo(info);
    },
    [viewerStore],
  );

  // React to external focus request (from panel double-click)
  const prevFocusEntityIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (focusEntityId && focusEntityId !== prevFocusEntityIdRef.current) {
      handleEntityFocus(focusEntityId);
      prevFocusEntityIdRef.current = focusEntityId;
    }
    if (!focusEntityId) {
      prevFocusEntityIdRef.current = null;
    }
  }, [focusEntityId, handleEntityFocus]);

  // React to focusWorldPosition from viewer store (minimap click)
  const focusWorldPosition = useViewerStore(viewerStore, (s) => s.focusWorldPosition);
  useEffect(() => {
    if (focusWorldPosition) {
      setFocusTarget(focusWorldPosition);
      viewerStore.getState().setFocusWorldPosition(null);
    }
  }, [focusWorldPosition, viewerStore]);

  const showInspector = useViewerStore(viewerStore, (s) => s.showInspector);

  // Determine if hover/click should be active
  const hoverActive =
    isEditMode && (gizmoMode === 'place' || gizmoMode === 'translate' || showInspector || !!positionPickActive);
  const clickActive = isEditMode && (gizmoMode === 'place' || !!positionPickActive);

  return (
    <>
      <SceneEnvironment showGrid={showGrid} />
      <CameraController ref={cameraRef} mode={cameraMode} focusTarget={focusTarget} flySpeed={flySpeed} cameraStateRef={cameraStateRef} />

      <RoadNetwork
        ref={roadGroupRef}
        odrDocument={openDriveDocument}
        showRoadMarks
        showRoadIds={showRoadIds}
        showLaneIds={showLaneIds}
        highlightedLaneRef={highlightedLaneRef}
      />

      {/* Traffic signals from OpenDRIVE */}
      {showTrafficSignals && (
        <TrafficSignalGroup
          openDriveDocument={openDriveDocument}
          showLabels={showEntityLabels}
          selectedSignalKey={selectedSignalKey}
          onSignalSelect={onSignalSelect}
          currentFrame={currentFrame}
        />
      )}

      {/* Road click handler for Place mode, hover detection, and pick mode */}
      {isEditMode && (hoverActive || clickActive) && (
        <RoadClickHandler
          roadGroupRef={roadGroupRef}
          hoverActive={hoverActive}
          clickActive={clickActive}
          hasSelectedEntity={selectedEntityId != null}
          openDriveDocument={openDriveDocument}
          snapToLane={snapToLane}
          reverseDirection={reverseDirection}
          onPlacement={handlePlacement}
          onHoverLaneChange={handleHoverLaneChange}
          highlightedLaneRef={highlightedLaneRef}
          pickModeActive={positionPickActive}
          onPositionPicked={onPositionPicked}
          onPositionPickCancel={onPositionPickCancel}
        />
      )}

      {/* Route preview overlay (shown when entity/action selected, not editing) */}
      {!routeEditActive && routePreviewData && routePreviewData.length > 0 && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <RoutePreviewOverlay previews={routePreviewData} />
        </group>
      )}

      {/* Route overlay (inside rotation group to match OpenDRIVE coords) */}
      {routeEditActive && routeWaypoints && routeWaypoints.length > 0 && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <RouteOverlay
            waypoints={routeWaypoints}
            pathSegments={routePathSegments ?? []}
            selectedWaypointIndex={routeSelectedWaypointIndex ?? null}
            onWaypointClick={onRouteWaypointClick}
            onWaypointContextMenu={onRouteWaypointContextMenu}
            onLineClick={onRouteLineClick}
            openDriveDocument={openDriveDocument}
            orbitControlsRef={cameraRef.current?.orbitControls}
            onWaypointDragEnd={onRouteWaypointDragEnd}
          />
        </group>
      )}

      {/* Route click handler for waypoint placement (route edit mode only) */}
      {routeEditActive && onRouteWaypointAdd && (
        <RouteClickHandler
          roadGroupRef={roadGroupRef}
          openDriveDocument={openDriveDocument}
          onWaypointAdd={onRouteWaypointAdd}
        />
      )}

      {/* Position markers for actions/conditions (inside rotation group) */}
      {!showSimulation && showPositionMarkers && scenarioPositions.length > 0 && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <PositionMarkersOverlay
            positions={scenarioPositions}
            highlightedElementIds={highlightedPositionElementIds ?? []}
          />
        </group>
      )}

      {/* Show init positions when not simulating */}
      {!showSimulation && (
        <EntityGroup
          entities={entities}
          entityPositions={entityPositions}
          selectedEntityId={selectedEntityId}
          hoveredEntityName={hoveredEntityName}
          onEntitySelect={onEntitySelect}
          onEntityFocus={handleEntityFocus}
          showLabels={showEntityLabels}
          gizmoMode={effectiveGizmoMode}
          orbitControlsRef={cameraRef.current?.orbitControls}
          onEntityPositionChange={effectiveOnPositionChange}
          openDriveDocument={openDriveDocument}
          snapToLane={snapToLane}
          selectedEntityRoadPosition={selectedEntityRoadPosition}
          routeOpacity={routeEditActive ? 0.3 : undefined}
        />
      )}

      {/* Show simulation positions during playback */}
      {showSimulation && (
        <SimulationOverlay
          entities={entities}
          currentFrame={currentFrame!}
          selectedEntityId={selectedEntityId}
          onEntitySelect={onEntitySelect}
          showLabels={showEntityLabels}
        />
      )}

      {/* Road editing gizmos (inside rotation group for OpenDRIVE coords) */}
      {roadEditMode && openDriveDocument && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <RoadEditingLayer
            openDriveDocument={openDriveDocument}
            selectedRoadId={roadEditSelectedRoadId ?? null}
            selectedGeometryIndex={roadEditSelectedGeometryIndex ?? null}
            onGeometryDragEnd={onRoadGeometryDragEnd}
            onGeometrySelect={onRoadGeometrySelect}
            orbitControlsRef={cameraRef.current?.orbitControls}
          />
        </group>
      )}
    </>
  );
}

/** Speed slider styles */
const speedSliderStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  backgroundColor: 'rgba(40, 40, 60, 0.85)',
  border: '1px solid rgba(100, 100, 140, 0.5)',
  borderRadius: '4px',
  zIndex: 10,
  pointerEvents: 'auto',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#ddd',
};

/**
 * Main exported 3D viewer component.
 * Renders the complete scenario visualization with road network and entities.
 */
export const ScenarioViewer: React.FC<ScenarioViewerProps> = ({
  scenarioStore,
  openDriveDocument,
  selectedEntityId = null,
  hoveredEntityName,
  onEntitySelect,
  onEntityFocus,
  onEntityPositionChange,
  currentFrame: currentFrameProp,
  simulationStatus,
  preferences,
  onViewerModeChange,
  className,
  style,
  focusEntityId,
  routeEditActive,
  routeWaypoints,
  routePathSegments,
  routeSelectedWaypointIndex,
  onRouteWaypointClick,
  onRouteWaypointContextMenu,
  onRouteLineClick,
  onRouteWaypointAdd,
  onRouteWaypointDragEnd,
  onRouteEditSave,
  onRouteEditCancel,
  routeWarnings,
  routeWaypointCount,
  resolveCatalogRoute,
  routePreviewData,
  selectedSignalKey,
  onSignalSelect,
  showPerf,
  positionPickActive,
  onPositionPicked,
  onPositionPickCancel,
  highlightedPositionElementIds,
  roadEditMode,
  roadEditSelectedRoadId,
  roadEditSelectedGeometryIndex,
  onRoadGeometryDragEnd,
  onRoadGeometrySelect,
}) => {
  const viewerStoreRef = useRef<ReturnType<typeof createViewerStore> | null>(null);
  if (!viewerStoreRef.current) {
    viewerStoreRef.current = createViewerStore(preferences);
  }
  const viewerStore = viewerStoreRef.current;

  // Camera state ref for minimap (written each frame by CameraController)
  const cameraStateRef = useRef({ position: new Vector3(), target: new Vector3() });

  // Auto-switch to play mode when simulation starts
  useEffect(() => {
    if (simulationStatus === 'running') {
      viewerStore.getState().setViewerMode('play');
    }
  }, [simulationStatus, viewerStore]);

  const handleEntitySelect = useCallback(
    (entityId: string) => onEntitySelect?.(entityId),
    [onEntitySelect],
  );

  const handleEntityFocus = useCallback(
    (entityId: string) => onEntityFocus?.(entityId),
    [onEntityFocus],
  );

  const entities = useScenarioEntities(scenarioStore);

  // Reactive state subscriptions for toolbar and speed slider
  const cameraMode = useViewerStore(viewerStore, (s) => s.cameraMode);
  const showGrid = useViewerStore(viewerStore, (s) => s.showGrid);
  const showEntityLabels = useViewerStore(viewerStore, (s) => s.showEntityLabels);
  const showRoadIds = useViewerStore(viewerStore, (s) => s.showRoadIds);
  const showLaneIds = useViewerStore(viewerStore, (s) => s.showLaneIds);
  const showTrafficSignals = useViewerStore(viewerStore, (s) => s.showTrafficSignals);
  const showPositionMarkersOuter = useViewerStore(viewerStore, (s) => s.showPositionMarkers);
  const gizmoMode = useViewerStore(viewerStore, (s) => s.gizmoMode);
  const reverseDirection = useViewerStore(viewerStore, (s) => s.reverseDirection);
  const snapToLane = useViewerStore(viewerStore, (s) => s.snapToLane);
  const viewerMode = useViewerStore(viewerStore, (s) => s.viewerMode);
  const followTargetEntity = useViewerStore(viewerStore, (s) => s.followTargetEntity);
  const flySpeed = useViewerStore(viewerStore, (s) => s.flySpeed);

  const hoverLaneInfo = useViewerStore(viewerStore, (s) => s.hoverLaneInfo);
  const showInspector = useViewerStore(viewerStore, (s) => s.showInspector);
  const showMinimap = useViewerStore(viewerStore, (s) => s.showMinimap);
  const minimapSize = useViewerStore(viewerStore, (s) => s.minimapSize);

  // Entity positions for minimap
  const entityPositions = useEntityPositions(scenarioStore, openDriveDocument);

  // Scenario positions for minimap markers
  const scenarioPositionsOuter = useScenarioPositions(scenarioStore, openDriveDocument);
  const minimapPositionMarkers = useMemo(() => {
    if (!showPositionMarkersOuter) return undefined;
    const highlightedSet = new Set(highlightedPositionElementIds ?? []);
    return scenarioPositionsOuter
      .filter((p) => p.worldCoords != null)
      .map((p) => ({
        x: p.worldCoords!.x,
        y: p.worldCoords!.y,
        category: p.category,
        isHighlighted: highlightedSet.has(p.ownerElementId),
      }));
  }, [scenarioPositionsOuter, showPositionMarkersOuter, highlightedPositionElementIds]);

  // Route data for minimap
  const minimapRoutes = useMemo(() => {
    const routes: Array<{ waypoints: Array<{ x: number; y: number }>; segments: Array<{ points: Array<{ x: number; y: number }> }> }> = [];

    // Active edit route
    if (routeEditActive && routeWaypoints && routeWaypoints.length > 0) {
      routes.push({
        waypoints: routeWaypoints.map((wp) => ({ x: wp.x, y: wp.y })),
        segments: (routePathSegments ?? []).map((seg) => ({
          points: seg.map((p) => ({ x: p.x, y: p.y })),
        })),
      });
    }

    // Preview routes
    if (!routeEditActive && routePreviewData) {
      for (const preview of routePreviewData) {
        routes.push({
          waypoints: preview.waypoints.map((wp) => ({ x: wp.x, y: wp.y })),
          segments: preview.pathSegments.map((seg) => ({
            points: seg.map((p) => ({ x: p.x, y: p.y })),
          })),
        });
      }
    }

    return routes.length > 0 ? routes : undefined;
  }, [routeEditActive, routeWaypoints, routePathSegments, routePreviewData]);

  // Minimap click handler
  const handleMinimapClick = useCallback(
    (worldX: number, worldY: number) => {
      // worldX, worldY are in OpenDRIVE coords
      // Convert to Three.js coords: (x, 0, -y)
      viewerStore.getState().setFocusWorldPosition([worldX, 0, -worldY]);
    },
    [viewerStore],
  );

  // Notify parent of viewer mode changes
  useEffect(() => {
    onViewerModeChange?.(viewerMode);
  }, [viewerMode, onViewerModeChange]);

  const isSimulating = simulationStatus === 'running';

  // Mode-based border color
  const modeBorderColor =
    viewerMode === 'edit' ? 'rgba(60, 120, 220, 0.5)' : 'rgba(60, 180, 100, 0.5)';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        border: `2px solid ${modeBorderColor}`,
        transition: 'border-color 0.3s ease',
        ...style,
      }}
    >
      <ViewerToolbar
        viewerMode={viewerMode}
        onViewerModeChange={(m) => viewerStore.getState().setViewerMode(m)}
        isSimulating={isSimulating}
        cameraMode={cameraMode}
        onCameraModeChange={(m) => viewerStore.getState().setCameraMode(m)}
        showGrid={showGrid}
        onToggleGrid={() => viewerStore.getState().toggleGrid()}
        showLabels={showEntityLabels}
        onToggleLabels={() => viewerStore.getState().toggleEntityLabels()}
        showRoadIds={showRoadIds}
        onToggleRoadIds={() => viewerStore.getState().toggleRoadIds()}
        showLaneIds={showLaneIds}
        onToggleLaneIds={() => viewerStore.getState().toggleLaneIds()}
        showTrafficSignals={showTrafficSignals}
        onToggleTrafficSignals={() => viewerStore.getState().toggleTrafficSignals()}
        gizmoMode={gizmoMode}
        onGizmoModeChange={(m) => viewerStore.getState().setGizmoMode(m)}
        reverseDirection={reverseDirection}
        onToggleReverseDirection={() => viewerStore.getState().toggleReverseDirection()}
        snapToLane={snapToLane}
        onToggleSnapToLane={() => viewerStore.getState().toggleSnapToLane()}
        followTargetEntity={followTargetEntity}
        onFollowTargetChange={(name) => viewerStore.getState().setFollowTarget(name)}
        entities={entities}
        showInspector={showInspector}
        onToggleInspector={() => viewerStore.getState().toggleInspector()}
        showPositionMarkers={showPositionMarkersOuter}
        onTogglePositionMarkers={() => viewerStore.getState().togglePositionMarkers()}
        showMinimap={showMinimap}
        onToggleMinimap={() => viewerStore.getState().toggleMinimap()}
        minimapSize={minimapSize}
        onCycleMinimapSize={() => viewerStore.getState().cycleMinimapSize()}
      />

      {/* Placement overlay (shown in Place mode with hover info, hidden during pick mode) */}
      {!positionPickActive && (
        <PlacementOverlay
          hoverLaneInfo={hoverLaneInfo}
          snapToLane={snapToLane}
          isPlaceMode={gizmoMode === 'place' && viewerMode === 'edit'}
        />
      )}

      {/* Position inspector overlay (shown when inspector is on or pick mode is active) */}
      {(gizmoMode !== 'place' || positionPickActive) && (
        <PositionInspectorOverlay
          hoverLaneInfo={hoverLaneInfo}
          visible={showInspector && viewerMode === 'edit'}
          pickModeActive={positionPickActive}
        />
      )}

      {/* Speed multiplier slider (top-right) */}
      <div style={speedSliderStyle}>
        <span>Speed</span>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={flySpeed}
          onChange={(e) => viewerStore.getState().setFlySpeed(Number(e.target.value))}
          className="cursor-pointer"
          style={{ width: 80 }}
        />
        <span style={{ minWidth: 30, textAlign: 'right' }}>{flySpeed.toFixed(1)}x</span>
      </div>

      {/* Route edit overlay (bottom-center, shown during route editing) */}
      {routeEditActive && onRouteEditSave && onRouteEditCancel && (
        <RouteEditOverlay
          waypointCount={routeWaypointCount ?? 0}
          warnings={routeWarnings ?? []}
          onSave={onRouteEditSave}
          onCancel={onRouteEditCancel}
        />
      )}

      {/* Minimap overlay (bottom-right) */}
      {showMinimap && (
        <Minimap
          openDriveDocument={openDriveDocument}
          entityPositions={entityPositions}
          entities={entities}
          selectedEntityId={selectedEntityId ?? null}
          cameraStateRef={cameraStateRef}
          size={minimapSize}
          onClickPosition={handleMinimapClick}
          currentFrame={currentFrameProp}
          positionMarkers={minimapPositionMarkers}
          routes={minimapRoutes}
        />
      )}

      <ViewerCanvas showPerf={showPerf}>
        <ScenarioViewerScene
          scenarioStore={scenarioStore}
          openDriveDocument={openDriveDocument}
          selectedEntityId={selectedEntityId ?? null}
          hoveredEntityName={hoveredEntityName}
          onEntitySelect={handleEntitySelect}
          onEntityFocus={handleEntityFocus}
          onEntityPositionChange={onEntityPositionChange}
          currentFrame={currentFrameProp}
          viewerStore={viewerStore}
          focusEntityId={focusEntityId}
          cameraStateRef={cameraStateRef}
          routeEditActive={routeEditActive}
          routeWaypoints={routeWaypoints}
          routePathSegments={routePathSegments}
          routeSelectedWaypointIndex={routeSelectedWaypointIndex}
          onRouteWaypointClick={onRouteWaypointClick}
          onRouteWaypointContextMenu={onRouteWaypointContextMenu}
          onRouteLineClick={onRouteLineClick}
          onRouteWaypointAdd={onRouteWaypointAdd}
          onRouteWaypointDragEnd={onRouteWaypointDragEnd}
          resolveCatalogRoute={resolveCatalogRoute}
          routePreviewData={routePreviewData}
          selectedSignalKey={selectedSignalKey}
          onSignalSelect={onSignalSelect}
          positionPickActive={positionPickActive}
          onPositionPicked={onPositionPicked}
          onPositionPickCancel={onPositionPickCancel}
          highlightedPositionElementIds={highlightedPositionElementIds}
          roadEditMode={roadEditMode}
          roadEditSelectedRoadId={roadEditSelectedRoadId}
          roadEditSelectedGeometryIndex={roadEditSelectedGeometryIndex}
          onRoadGeometryDragEnd={onRoadGeometryDragEnd}
          onRoadGeometrySelect={onRoadGeometrySelect}
        />
      </ViewerCanvas>
    </div>
  );
};

ScenarioViewer.displayName = 'ScenarioViewer';
