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
import { TrajectoryOverlay } from '../trajectory/TrajectoryOverlay.js';
import { TrajectoryClickHandler } from '../interaction/TrajectoryClickHandler.js';
import { TrajectoryEditOverlay } from '../trajectory/TrajectoryEditOverlay.js';
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

  // ---- Trajectory Editing ----
  /** Whether trajectory editing mode is active */
  trajectoryEditActive?: boolean;
  /** Trajectory shape type being edited */
  trajectoryShapeType?: 'polyline' | 'clothoid' | 'nurbs';
  /** World positions of trajectory points (vertices / origin / control points) */
  trajectoryPoints?: Array<{ x: number; y: number; z: number; h: number }>;
  /** Evaluated curve sample points for rendering */
  trajectoryCurvePoints?: Array<{ x: number; y: number; z: number }>;
  /** Time values per point */
  trajectoryPointTimes?: Array<number | undefined>;
  /** Currently selected point index */
  trajectorySelectedPointIndex?: number | null;
  /** Callback when user clicks a trajectory point marker */
  onTrajectoryPointClick?: (index: number) => void;
  /** Callback when user right-clicks a trajectory point marker */
  onTrajectoryPointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  /** Callback when user clicks the trajectory line */
  onTrajectoryLineClick?: (event: ThreeEvent<MouseEvent>) => void;
  /** Callback when user double-clicks road surface to add a point */
  onTrajectoryPointAdd?: (
    worldX: number, worldY: number, worldZ: number, heading: number,
    roadId: string, laneId: string, s: number, offset: number,
  ) => void;
  /** Callback when user drags a point to a new position */
  onTrajectoryPointDragEnd?: (
    index: number,
    worldX: number, worldY: number, worldZ: number, heading: number,
    roadId: string, laneId: string, s: number, offset: number,
  ) => void;
  /** Callback to save and exit trajectory editing */
  onTrajectoryEditSave?: () => void;
  /** Callback to cancel trajectory editing */
  onTrajectoryEditCancel?: () => void;
  /** Warnings from trajectory validation */
  trajectoryWarnings?: string[];
  /** Number of points in the editing trajectory */
  trajectoryPointCount?: number;

  /** Currently selected traffic signal key (roadId:signalId) */
  selectedSignalKey?: string | null;
  /** Callback when user clicks a traffic signal in the viewer */
  onSignalSelect?: (key: string) => void;
  /** Signal IDs to highlight in the viewer (e.g. signals belonging to selected controller) */
  highlightedSignalIds?: ReadonlySet<string>;
  /** Signal pick mode configuration (null = not in pick mode) */
  signalPickMode?: {
    bulbCount: number;
    trackSignalIds: ReadonlySet<string>;
    allTrackSignalMap: ReadonlyMap<string, ReadonlySet<string>>;
  } | null;
  /** Callback when a signal is hovered during pick mode */
  onSignalHover?: (signalId: string | null) => void;
  /** Map from signalId to assembly info for arm pole rendering */
  signalAssemblyMap?: Map<string, import('../signals/InstancedPoles.js').PoleAssemblyInfo>;
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
  /** Callback when a control point is Ctrl+dragged to translate (only x,y change) */
  onRoadGeometryDragEnd?: (
    roadId: string,
    geometryIndex: number,
    newX: number,
    newY: number,
  ) => void;
  /** Callback when a start point is dragged to reshape (keep endpoint fixed) */
  onRoadStartpointDragEnd?: (
    roadId: string,
    geometryIndex: number,
    updates: { x: number; y: number; hdg: number; length: number; curvature?: number },
  ) => void;
  /** Callback when a geometry control point is selected */
  onRoadGeometrySelect?: (roadId: string, geometryIndex: number) => void;
  /** Whether road creation mode is active (click ground to create) */
  roadCreationModeActive?: boolean;
  /** Current creation phase */
  roadCreationPhase?: 'idle' | 'startPlaced';
  /** Start position (valid when phase === 'startPlaced') */
  roadCreationStartX?: number;
  roadCreationStartY?: number;
  roadCreationStartHdg?: number;
  /** Cursor position for ghost preview */
  roadCreationCursorX?: number;
  roadCreationCursorY?: number;
  /** Lane sections for ghost preview */
  roadCreationLanes?: import('@osce/shared').OdrLaneSection[];
  /** Callback when user clicks to place start point */
  onRoadCreationStartPlace?: (
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
  onRoadCreationCursorMove?: (x: number, y: number) => void;
  /** Whether grid snap is enabled for road editing */
  roadGridSnap?: boolean;
  /** Callback when a tangent handle is dragged to change heading */
  onRoadHeadingDragEnd?: (roadId: string, geometryIndex: number, newHdg: number) => void;
  /** Callback when arc curvature is changed via drag */
  onRoadCurvatureDragEnd?: (roadId: string, geometryIndex: number, newCurvature: number) => void;
  /** Callback when a geometry point is Shift+clicked */
  onRoadGeometryShiftClick?: (roadId: string, geometryIndex: number) => void;
  /** Callback when an endpoint gizmo is dragged to reshape geometry */
  onRoadEndpointDragEnd?: (
    roadId: string,
    geometryIndex: number,
    updates: { hdg?: number; length: number; curvature?: number },
  ) => void;
  /** Set of selected geometry indices for multi-selection */
  roadEditSelectedGeometryIndices?: Set<number>;
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
  onRoadEndpointContextMenu?: (
    roadId: string,
    contactPoint: 'start' | 'end',
    screenX: number,
    screenY: number,
  ) => void;
  /** Whether road creation has a heading constraint at start */
  roadCreationHasStartConstraint?: boolean;
  /** Whether road select mode is active (click road meshes to select) */
  roadSelectModeActive?: boolean;
  /** Callback when a road is selected via click in the 3D viewer */
  onRoadSelect?: (roadId: string) => void;
  /** Callback when a road is hovered in select mode */
  onRoadHover?: (roadId: string | null) => void;

  // ---- Lane Editing ----
  /** Whether lane editing mode is active */
  laneEditActive?: boolean;
  /** Active road ID for lane editing */
  laneEditRoadId?: string | null;
  /** Callback when a lane is hovered in lane edit mode */
  onLaneHover?: (info: import('../interaction/road-editing/LaneEditInteraction.js').LaneHoverInfo | null) => void;
  /** Callback when a lane is clicked in lane edit mode */
  onLaneClick?: (info: import('../interaction/road-editing/LaneEditInteraction.js').LaneHoverInfo) => void;
  /** Callback when a lane is right-clicked */
  onLaneContextMenu?: (info: import('../interaction/road-editing/LaneEditInteraction.js').LaneHoverInfo, screenX: number, screenY: number) => void;
  /** Callback when road surface is right-clicked (for section split) */
  onRoadSurfaceContextMenu?: (roadId: string, s: number, screenX: number, screenY: number) => void;
  /** Callback when a section boundary is dragged */
  onSectionBoundaryDragEnd?: (roadId: string, sectionIdx: number, newS: number) => void;
  /** Current lane edit sub-mode */
  laneEditSubMode?: import('../interaction/road-editing/LaneEditInteraction.js').LaneEditSubModeType;
  /** Callback when split mode click occurs */
  onSplitClick?: (roadId: string, sectionIdx: number, s: number) => void;
  /** Callback when taper start/end is clicked */
  onTaperClick?: (roadId: string, s: number, side: 'left' | 'right') => void;
  /** Taper creation phase for preview rendering */
  taperCreationPhase?: 'idle' | 'start-picked' | 'end-picked' | 'lane-extend';
  /** Taper start S (when phase === 'start-picked') */
  taperStartS?: number;
  /** Taper target side */
  taperSide?: 'left' | 'right';

  // ---- Junction Create ----
  /** Whether junction create mode is active */
  junctionCreateActive?: boolean;
  /** Selected endpoints for junction creation */
  junctionCreateSelectedEndpoints?: Array<{ roadId: string; contactPoint: 'start' | 'end' }>;
  /** Currently hovered endpoint */
  junctionCreateHoveredEndpoint?: { roadId: string; contactPoint: 'start' | 'end' } | null;
  /** Callback when an endpoint is clicked */
  onJunctionEndpointClick?: (roadId: string, contactPoint: 'start' | 'end') => void;
  /** Callback when an endpoint is hovered */
  onJunctionEndpointHover?: (endpoint: { roadId: string; contactPoint: 'start' | 'end' } | null) => void;

  // ---- Signal Place ----
  /** Whether signal place mode is active */
  signalPlaceActive?: boolean;
  /** Signal place sub-mode */
  signalPlaceSubMode?: 'place' | 'move';
  /** Signal t-snap mode */
  signalPlaceTSnapMode?: 'lane-above' | 'road-edge';
  /** Ghost preview data for signal placement */
  signalPlaceGhost?: import('../interaction/road-editing/SignalPlaceInteraction.js').SignalPlaceGhostData | null;
  /** Callback when user clicks to place a signal */
  onSignalPlace?: (roadId: string, s: number, t: number, heading: number) => void;
  /** Callback to update ghost preview position */
  onSignalGhostUpdate?: (ghost: import('../interaction/road-editing/SignalPlaceInteraction.js').SignalPlaceGhostData | null) => void;
  /** Callback when a signal is moved via drag */
  onSignalMove?: (
    roadId: string,
    signalId: string,
    newS: number,
    newT: number,
    armInfo?: { armLength: number; armAngle: number },
  ) => void;

  // ---- Junction Editing ----
  /** Currently selected junction ID (renders with highlight) */
  selectedJunctionId?: string | null;
  /** Ghost junction surface data for auto-detection preview */
  ghostJunctionSurface?: import('@osce/opendrive').JunctionSurfaceData | null;
  /** Callback when a junction surface is clicked */
  onJunctionClick?: (junctionId: string) => void;
  /** Callback when a junction surface is right-clicked */
  onJunctionContextMenu?: (junctionId: string, event: ThreeEvent<MouseEvent>) => void;
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
  trajectoryEditActive,
  trajectoryShapeType,
  trajectoryPoints,
  trajectoryCurvePoints,
  trajectoryPointTimes,
  trajectorySelectedPointIndex,
  onTrajectoryPointClick,
  onTrajectoryPointContextMenu,
  onTrajectoryLineClick,
  onTrajectoryPointAdd,
  onTrajectoryPointDragEnd,
  selectedSignalKey,
  onSignalSelect,
  highlightedSignalIds,
  signalPickMode,
  onSignalHover,
  signalAssemblyMap,
  positionPickActive,
  onPositionPicked,
  onPositionPickCancel,
  highlightedPositionElementIds,
  roadEditMode,
  roadEditSelectedRoadId,
  roadEditSelectedGeometryIndex,
  onRoadGeometryDragEnd,
  onRoadStartpointDragEnd,
  onRoadGeometrySelect,
  roadCreationModeActive,
  roadCreationPhase,
  roadCreationStartX,
  roadCreationStartY,
  roadCreationStartHdg,
  roadCreationCursorX,
  roadCreationCursorY,
  roadCreationLanes,
  onRoadCreationStartPlace,
  onRoadCreate,
  onRoadCreationCursorMove,
  roadGridSnap,
  onRoadHeadingDragEnd,
  onRoadCurvatureDragEnd,
  onRoadEndpointDragEnd,
  onRoadGeometryShiftClick,
  roadEditSelectedGeometryIndices,
  onRoadLinkSet,
  onRoadLinkUnset,
  onRoadEndpointContextMenu,
  roadCreationHasStartConstraint,
  roadSelectModeActive,
  onRoadSelect,
  onRoadHover,
  laneEditActive,
  laneEditRoadId,
  onLaneHover,
  onLaneClick,
  onLaneContextMenu,
  onRoadSurfaceContextMenu,
  onSectionBoundaryDragEnd,
  laneEditSubMode,
  onSplitClick,
  onTaperClick,
  taperCreationPhase,
  taperStartS,
  taperSide,
  junctionCreateActive,
  junctionCreateSelectedEndpoints,
  junctionCreateHoveredEndpoint,
  onJunctionEndpointClick,
  onJunctionEndpointHover,
  signalPlaceActive,
  signalPlaceSubMode,
  signalPlaceTSnapMode,
  signalPlaceGhost,
  onSignalPlace,
  onSignalGhostUpdate,
  onSignalMove,
  selectedJunctionId,
  ghostJunctionSurface,
  onJunctionClick,
  onJunctionContextMenu,
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
  trajectoryEditActive?: boolean;
  trajectoryShapeType?: 'polyline' | 'clothoid' | 'nurbs';
  trajectoryPoints?: Array<{ x: number; y: number; z: number; h: number }>;
  trajectoryCurvePoints?: Array<{ x: number; y: number; z: number }>;
  trajectoryPointTimes?: Array<number | undefined>;
  trajectorySelectedPointIndex?: number | null;
  onTrajectoryPointClick?: (index: number) => void;
  onTrajectoryPointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  onTrajectoryLineClick?: (event: ThreeEvent<MouseEvent>) => void;
  onTrajectoryPointAdd?: ScenarioViewerProps['onTrajectoryPointAdd'];
  onTrajectoryPointDragEnd?: ScenarioViewerProps['onTrajectoryPointDragEnd'];
  selectedSignalKey?: string | null;
  onSignalSelect?: (key: string) => void;
  highlightedSignalIds?: ReadonlySet<string>;
  signalPickMode?: ScenarioViewerProps['signalPickMode'];
  onSignalHover?: (signalId: string | null) => void;
  signalAssemblyMap?: ScenarioViewerProps['signalAssemblyMap'];
  positionPickActive?: boolean;
  onPositionPicked?: (data: PickedPositionData) => void;
  onPositionPickCancel?: () => void;
  highlightedPositionElementIds?: string[];
  roadEditMode?: boolean;
  roadEditSelectedRoadId?: string | null;
  roadEditSelectedGeometryIndex?: number | null;
  onRoadGeometryDragEnd?: ScenarioViewerProps['onRoadGeometryDragEnd'];
  onRoadStartpointDragEnd?: ScenarioViewerProps['onRoadStartpointDragEnd'];
  onRoadGeometrySelect?: ScenarioViewerProps['onRoadGeometrySelect'];
  roadCreationModeActive?: boolean;
  roadCreationPhase?: 'idle' | 'startPlaced';
  roadCreationStartX?: number;
  roadCreationStartY?: number;
  roadCreationStartHdg?: number;
  roadCreationCursorX?: number;
  roadCreationCursorY?: number;
  roadCreationLanes?: ScenarioViewerProps['roadCreationLanes'];
  onRoadCreationStartPlace?: ScenarioViewerProps['onRoadCreationStartPlace'];
  onRoadCreate?: ScenarioViewerProps['onRoadCreate'];
  onRoadCreationCursorMove?: ScenarioViewerProps['onRoadCreationCursorMove'];
  roadGridSnap?: boolean;
  onRoadHeadingDragEnd?: ScenarioViewerProps['onRoadHeadingDragEnd'];
  onRoadCurvatureDragEnd?: ScenarioViewerProps['onRoadCurvatureDragEnd'];
  onRoadEndpointDragEnd?: ScenarioViewerProps['onRoadEndpointDragEnd'];
  onRoadGeometryShiftClick?: ScenarioViewerProps['onRoadGeometryShiftClick'];
  roadEditSelectedGeometryIndices?: Set<number>;
  onRoadLinkSet?: ScenarioViewerProps['onRoadLinkSet'];
  onRoadLinkUnset?: ScenarioViewerProps['onRoadLinkUnset'];
  onRoadEndpointContextMenu?: ScenarioViewerProps['onRoadEndpointContextMenu'];
  roadCreationHasStartConstraint?: boolean;
  roadSelectModeActive?: boolean;
  onRoadSelect?: (roadId: string) => void;
  onRoadHover?: (roadId: string | null) => void;
  laneEditActive?: boolean;
  laneEditRoadId?: string | null;
  onLaneHover?: ScenarioViewerProps['onLaneHover'];
  onLaneClick?: ScenarioViewerProps['onLaneClick'];
  onLaneContextMenu?: ScenarioViewerProps['onLaneContextMenu'];
  onRoadSurfaceContextMenu?: ScenarioViewerProps['onRoadSurfaceContextMenu'];
  onSectionBoundaryDragEnd?: ScenarioViewerProps['onSectionBoundaryDragEnd'];
  laneEditSubMode?: ScenarioViewerProps['laneEditSubMode'];
  onSplitClick?: ScenarioViewerProps['onSplitClick'];
  onTaperClick?: ScenarioViewerProps['onTaperClick'];
  taperCreationPhase?: ScenarioViewerProps['taperCreationPhase'];
  taperStartS?: ScenarioViewerProps['taperStartS'];
  taperSide?: ScenarioViewerProps['taperSide'];
  junctionCreateActive?: boolean;
  junctionCreateSelectedEndpoints?: ScenarioViewerProps['junctionCreateSelectedEndpoints'];
  junctionCreateHoveredEndpoint?: ScenarioViewerProps['junctionCreateHoveredEndpoint'];
  onJunctionEndpointClick?: ScenarioViewerProps['onJunctionEndpointClick'];
  onJunctionEndpointHover?: ScenarioViewerProps['onJunctionEndpointHover'];
  signalPlaceActive?: boolean;
  signalPlaceSubMode?: ScenarioViewerProps['signalPlaceSubMode'];
  signalPlaceTSnapMode?: ScenarioViewerProps['signalPlaceTSnapMode'];
  signalPlaceGhost?: ScenarioViewerProps['signalPlaceGhost'];
  onSignalPlace?: ScenarioViewerProps['onSignalPlace'];
  onSignalGhostUpdate?: ScenarioViewerProps['onSignalGhostUpdate'];
  onSignalMove?: ScenarioViewerProps['onSignalMove'];
  selectedJunctionId?: string | null;
  ghostJunctionSurface?: ScenarioViewerProps['ghostJunctionSurface'];
  onJunctionClick?: ScenarioViewerProps['onJunctionClick'];
  onJunctionContextMenu?: ScenarioViewerProps['onJunctionContextMenu'];
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
        selectedJunctionId={selectedJunctionId}
        ghostJunctionSurface={ghostJunctionSurface}
        onJunctionClick={onJunctionClick}
        onJunctionContextMenu={onJunctionContextMenu}
      />

      {/* Traffic signals from OpenDRIVE */}
      {showTrafficSignals && (
        <TrafficSignalGroup
          openDriveDocument={openDriveDocument}
          showLabels={showEntityLabels}
          selectedSignalKey={selectedSignalKey}
          onSignalSelect={onSignalSelect}
          currentFrame={currentFrame}
          highlightedSignalIds={highlightedSignalIds}
          signalPickMode={signalPickMode}
          onSignalHover={onSignalHover}
          assemblyMap={signalAssemblyMap}
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

      {/* Trajectory overlay (inside rotation group to match OpenDRIVE coords) */}
      {trajectoryEditActive && trajectoryPoints && trajectoryPoints.length > 0 && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <TrajectoryOverlay
            points={trajectoryPoints}
            curvePoints={trajectoryCurvePoints ?? []}
            pointTimes={trajectoryPointTimes}
            selectedPointIndex={trajectorySelectedPointIndex ?? null}
            shapeType={trajectoryShapeType ?? 'polyline'}
            onPointClick={onTrajectoryPointClick}
            onPointContextMenu={onTrajectoryPointContextMenu}
            onLineClick={onTrajectoryLineClick}
            openDriveDocument={openDriveDocument}
            orbitControlsRef={cameraRef.current?.orbitControls}
            onPointDragEnd={onTrajectoryPointDragEnd}
          />
        </group>
      )}

      {/* Trajectory click handler for point placement (trajectory edit mode only) */}
      {trajectoryEditActive && onTrajectoryPointAdd && (
        <TrajectoryClickHandler
          roadGroupRef={roadGroupRef}
          openDriveDocument={openDriveDocument}
          onPointAdd={onTrajectoryPointAdd}
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
            onStartpointDragEnd={onRoadStartpointDragEnd}
            onGeometrySelect={onRoadGeometrySelect}
            orbitControlsRef={cameraRef.current?.orbitControls}
            creationModeActive={roadCreationModeActive}
            creationPhase={roadCreationPhase}
            creationStartX={roadCreationStartX}
            creationStartY={roadCreationStartY}
            creationStartHdg={roadCreationStartHdg}
            creationCursorX={roadCreationCursorX}
            creationCursorY={roadCreationCursorY}
            creationLanes={roadCreationLanes}
            onCreationStartPlace={onRoadCreationStartPlace}
            onRoadCreate={onRoadCreate}
            onCreationCursorMove={onRoadCreationCursorMove}
            gridSnap={roadGridSnap}
            onHeadingDragEnd={onRoadHeadingDragEnd}
            onCurvatureDragEnd={onRoadCurvatureDragEnd}
            onEndpointDragEnd={onRoadEndpointDragEnd}
            onGeometryShiftClick={onRoadGeometryShiftClick}
            selectedGeometryIndices={roadEditSelectedGeometryIndices}
            onRoadLinkSet={onRoadLinkSet}
            onRoadLinkUnset={onRoadLinkUnset}
            onEndpointContextMenu={onRoadEndpointContextMenu}
            creationHasStartConstraint={roadCreationHasStartConstraint}
            selectModeActive={roadSelectModeActive}
            roadGroupRef={roadGroupRef}
            onRoadSelect={onRoadSelect}
            onRoadHover={onRoadHover}
            laneEditActive={laneEditActive}
            laneEditRoadId={laneEditRoadId}
            onLaneHover={onLaneHover}
            onLaneClick={onLaneClick}
            onLaneContextMenu={onLaneContextMenu}
            onRoadSurfaceContextMenu={onRoadSurfaceContextMenu}
            onSectionBoundaryDragEnd={onSectionBoundaryDragEnd}
            laneEditSubMode={laneEditSubMode}
            onSplitClick={onSplitClick}
            onTaperClick={onTaperClick}
            taperCreationPhase={taperCreationPhase}
            taperStartS={taperStartS}
            taperSide={taperSide}
            junctionCreateActive={junctionCreateActive}
            junctionCreateSelectedEndpoints={junctionCreateSelectedEndpoints}
            junctionCreateHoveredEndpoint={junctionCreateHoveredEndpoint}
            onJunctionEndpointClick={onJunctionEndpointClick}
            onJunctionEndpointHover={onJunctionEndpointHover}
            signalPlaceActive={signalPlaceActive}
            signalPlaceSubMode={signalPlaceSubMode}
            signalPlaceTSnapMode={signalPlaceTSnapMode}
            signalPlaceGhost={signalPlaceGhost}
            onSignalPlace={onSignalPlace}
            onSignalGhostUpdate={onSignalGhostUpdate}
            onSignalMove={onSignalMove}
            selectedSignalKey={selectedSignalKey}
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
  trajectoryEditActive,
  trajectoryShapeType,
  trajectoryPoints,
  trajectoryCurvePoints,
  trajectoryPointTimes,
  trajectorySelectedPointIndex,
  onTrajectoryPointClick,
  onTrajectoryPointContextMenu,
  onTrajectoryLineClick,
  onTrajectoryPointAdd,
  onTrajectoryPointDragEnd,
  onTrajectoryEditSave,
  onTrajectoryEditCancel,
  trajectoryWarnings,
  trajectoryPointCount,
  selectedSignalKey,
  onSignalSelect,
  highlightedSignalIds,
  signalPickMode,
  onSignalHover,
  signalAssemblyMap,
  showPerf,
  positionPickActive,
  onPositionPicked,
  onPositionPickCancel,
  highlightedPositionElementIds,
  roadEditMode,
  roadEditSelectedRoadId,
  roadEditSelectedGeometryIndex,
  onRoadGeometryDragEnd,
  onRoadStartpointDragEnd,
  onRoadGeometrySelect,
  roadCreationModeActive,
  roadCreationPhase,
  roadCreationStartX,
  roadCreationStartY,
  roadCreationStartHdg,
  roadCreationCursorX,
  roadCreationCursorY,
  roadCreationLanes,
  onRoadCreationStartPlace,
  onRoadCreate,
  onRoadCreationCursorMove,
  roadGridSnap,
  onRoadHeadingDragEnd,
  onRoadCurvatureDragEnd,
  onRoadEndpointDragEnd,
  onRoadGeometryShiftClick,
  roadEditSelectedGeometryIndices,
  onRoadLinkSet,
  onRoadLinkUnset,
  onRoadEndpointContextMenu,
  roadCreationHasStartConstraint,
  roadSelectModeActive,
  onRoadSelect,
  onRoadHover,
  laneEditActive,
  laneEditRoadId,
  onLaneHover,
  onLaneClick,
  onLaneContextMenu,
  onRoadSurfaceContextMenu,
  onSectionBoundaryDragEnd,
  laneEditSubMode,
  onSplitClick,
  onTaperClick,
  taperCreationPhase,
  taperStartS,
  taperSide,
  junctionCreateActive,
  junctionCreateSelectedEndpoints,
  junctionCreateHoveredEndpoint,
  onJunctionEndpointClick,
  onJunctionEndpointHover,
  signalPlaceActive,
  signalPlaceSubMode,
  signalPlaceTSnapMode,
  signalPlaceGhost,
  onSignalPlace,
  onSignalGhostUpdate,
  onSignalMove,
  selectedJunctionId,
  ghostJunctionSurface,
  onJunctionClick,
  onJunctionContextMenu,
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

      {/* Trajectory edit overlay (bottom-center, shown during trajectory editing) */}
      {trajectoryEditActive && onTrajectoryEditSave && onTrajectoryEditCancel && (
        <TrajectoryEditOverlay
          shapeType={trajectoryShapeType ?? 'polyline'}
          pointCount={trajectoryPointCount ?? 0}
          warnings={trajectoryWarnings ?? []}
          onSave={onTrajectoryEditSave}
          onCancel={onTrajectoryEditCancel}
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
          trajectoryEditActive={trajectoryEditActive}
          trajectoryShapeType={trajectoryShapeType}
          trajectoryPoints={trajectoryPoints}
          trajectoryCurvePoints={trajectoryCurvePoints}
          trajectoryPointTimes={trajectoryPointTimes}
          trajectorySelectedPointIndex={trajectorySelectedPointIndex}
          onTrajectoryPointClick={onTrajectoryPointClick}
          onTrajectoryPointContextMenu={onTrajectoryPointContextMenu}
          onTrajectoryLineClick={onTrajectoryLineClick}
          onTrajectoryPointAdd={onTrajectoryPointAdd}
          onTrajectoryPointDragEnd={onTrajectoryPointDragEnd}
          selectedSignalKey={selectedSignalKey}
          onSignalSelect={onSignalSelect}
          highlightedSignalIds={highlightedSignalIds}
          signalPickMode={signalPickMode}
          onSignalHover={onSignalHover}
          signalAssemblyMap={signalAssemblyMap}
          positionPickActive={positionPickActive}
          onPositionPicked={onPositionPicked}
          onPositionPickCancel={onPositionPickCancel}
          highlightedPositionElementIds={highlightedPositionElementIds}
          roadEditMode={roadEditMode}
          roadEditSelectedRoadId={roadEditSelectedRoadId}
          roadEditSelectedGeometryIndex={roadEditSelectedGeometryIndex}
          onRoadGeometryDragEnd={onRoadGeometryDragEnd}
          onRoadStartpointDragEnd={onRoadStartpointDragEnd}
          onRoadGeometrySelect={onRoadGeometrySelect}
          roadCreationModeActive={roadCreationModeActive}
          roadCreationPhase={roadCreationPhase}
          roadCreationStartX={roadCreationStartX}
          roadCreationStartY={roadCreationStartY}
          roadCreationStartHdg={roadCreationStartHdg}
          roadCreationCursorX={roadCreationCursorX}
          roadCreationCursorY={roadCreationCursorY}
          roadCreationLanes={roadCreationLanes}
          onRoadCreationStartPlace={onRoadCreationStartPlace}
          onRoadCreate={onRoadCreate}
          onRoadCreationCursorMove={onRoadCreationCursorMove}
          roadGridSnap={roadGridSnap}
          onRoadHeadingDragEnd={onRoadHeadingDragEnd}
          onRoadCurvatureDragEnd={onRoadCurvatureDragEnd}
          onRoadEndpointDragEnd={onRoadEndpointDragEnd}
          onRoadGeometryShiftClick={onRoadGeometryShiftClick}
          roadEditSelectedGeometryIndices={roadEditSelectedGeometryIndices}
          onRoadLinkSet={onRoadLinkSet}
          onRoadLinkUnset={onRoadLinkUnset}
          onRoadEndpointContextMenu={onRoadEndpointContextMenu}
          roadCreationHasStartConstraint={roadCreationHasStartConstraint}
          roadSelectModeActive={roadSelectModeActive}
          onRoadSelect={onRoadSelect}
          onRoadHover={onRoadHover}
          laneEditActive={laneEditActive}
          laneEditRoadId={laneEditRoadId}
          onLaneHover={onLaneHover}
          onLaneClick={onLaneClick}
          onLaneContextMenu={onLaneContextMenu}
          onRoadSurfaceContextMenu={onRoadSurfaceContextMenu}
          onSectionBoundaryDragEnd={onSectionBoundaryDragEnd}
          laneEditSubMode={laneEditSubMode}
          onSplitClick={onSplitClick}
          onTaperClick={onTaperClick}
          taperCreationPhase={taperCreationPhase}
          taperStartS={taperStartS}
          taperSide={taperSide}
          junctionCreateActive={junctionCreateActive}
          junctionCreateSelectedEndpoints={junctionCreateSelectedEndpoints}
          junctionCreateHoveredEndpoint={junctionCreateHoveredEndpoint}
          onJunctionEndpointClick={onJunctionEndpointClick}
          onJunctionEndpointHover={onJunctionEndpointHover}
          signalPlaceActive={signalPlaceActive}
          signalPlaceSubMode={signalPlaceSubMode}
          signalPlaceTSnapMode={signalPlaceTSnapMode}
          signalPlaceGhost={signalPlaceGhost}
          onSignalPlace={onSignalPlace}
          onSignalGhostUpdate={onSignalGhostUpdate}
          onSignalMove={onSignalMove}
          selectedJunctionId={selectedJunctionId}
          ghostJunctionSurface={ghostJunctionSurface}
          onJunctionClick={onJunctionClick}
          onJunctionContextMenu={onJunctionContextMenu}
        />
      </ViewerCanvas>
    </div>
  );
};

ScenarioViewer.displayName = 'ScenarioViewer';
