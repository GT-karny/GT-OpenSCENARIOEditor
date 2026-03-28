/**
 * @osce/3d-viewer - Three.js based 3D scenario viewer for OpenSCENARIO editor.
 */

// Main component
export { ScenarioViewer } from './components/ScenarioViewer.js';
export type { ScenarioViewerProps } from './components/ScenarioViewer.js';

// Viewer store (for advanced usage / external control)
export { createViewerStore, useViewerStore } from './store/viewer-store.js';
export type {
  ViewerState,
  ViewerActions,
  ViewerStore,
  CameraMode,
  ViewerMode,
  GizmoMode,
  MinimapSize,
  HoverLaneInfo,
  PlaybackState,
} from './store/viewer-types.js';

// Utility functions (for consumers who want to build custom viewers)
export { getLaneColor } from './utils/lane-type-colors.js';
export { resolvePositionToWorld } from './utils/position-resolver.js';
export type { WorldCoords, PositionResolveOptions } from './utils/position-resolver.js';
export { getEntityGeometry, getEntityColor } from './utils/entity-geometry.js';
export type { EntityGeometryParams } from './utils/entity-geometry.js';
export { roadCoordsToWorld } from './utils/road-projection.js';
export type { RoadProjectionResult } from './utils/road-projection.js';

// Scenario data bridge hooks
export { useScenarioEntities } from './scenario/useScenarioEntities.js';
export { useEntityPositions, extractEntityPositions } from './scenario/useEntityPositions.js';
export { useScenarioPositions, collectScenarioPositions } from './scenario/useScenarioPositions.js';
export type { ScenarioPositionEntry } from './scenario/useScenarioPositions.js';

// Position markers
export { PositionMarkersOverlay } from './markers/PositionMarkersOverlay.js';
export type { PositionMarkersOverlayProps } from './markers/PositionMarkersOverlay.js';

// Route visualization & interaction
export { RouteOverlay } from './route/RouteOverlay.js';
export type { RouteOverlayProps } from './route/RouteOverlay.js';
export { RouteEditOverlay } from './route/RouteEditOverlay.js';
export { RoutePreviewOverlay } from './route/RoutePreviewOverlay.js';
export type { RoutePreviewData, RoutePreviewOverlayProps } from './route/RoutePreviewOverlay.js';
export { RouteClickHandler } from './interaction/RouteClickHandler.js';

// Position inspector & pick mode
export { PositionInspectorOverlay } from './interaction/PositionInspectorOverlay.js';
export type { PickedPositionData } from './interaction/RoadClickHandler.js';

// Traffic signal rendering
export { TrafficSignalGroup } from './signals/TrafficSignalGroup.js';
export type { ResolvedSignal } from './signals/TrafficSignalGroup.js';
export type { PoleAssemblyInfo } from './signals/InstancedPoles.js';
export { classifySignal } from './utils/signal-geometry.js';
export type { SignalCategory } from './utils/signal-geometry.js';
export { resolveSignalPosition } from './utils/signal-position-resolver.js';

// Signal catalog (types, data, and state parsing for 2D consumers)
export type {
  SignalDescriptor,
  BulbDefinition,
  BulbColor,
  BulbFaceShape,
} from './utils/signal-catalog.js';
export { SIGNAL_CATALOG, resolveSignalDescriptor } from './utils/signal-catalog.js';
export { isBulbActiveByIndex, getBulbMode, hasFlashingBulb } from './utils/parse-traffic-light-state.js';
export type { BulbMode } from './utils/parse-traffic-light-state.js';

// Road editing gizmos
export { RoadEditingLayer } from './interaction/road-editing/index.js';
export { computeAutoArc, computeGeometryEndpoint } from './interaction/road-editing/index.js';
export type { AutoArcResult } from './interaction/road-editing/index.js';

// Sub-components (for composition)
export { RoadNetwork } from './road/RoadNetwork.js';
export { EntityGroup } from './entities/EntityGroup.js';
export { ViewerCanvas } from './scene/ViewerCanvas.js';
export { CameraController } from './scene/CameraController.js';
export { SceneEnvironment } from './scene/SceneEnvironment.js';
