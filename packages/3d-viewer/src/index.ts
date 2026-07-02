/**
 * @osce/3d-viewer - Three.js based 3D scenario viewer for OpenSCENARIO editor.
 */

// Main component
export { ScenarioViewer } from './components/ScenarioViewer.js';
export type {
  ScenarioViewerProps,
  RouteEditConfig,
  TrajectoryEditConfig,
  SignalSelectionConfig,
  PositionPickConfig,
  RoadEditingConfig,
  LaneEditConfig,
  JunctionToolsConfig,
  SignalPlaceConfig,
} from './components/ScenarioViewer.js';

// Viewer store types (consumed externally by apps/web for ViewerMode etc.)
export type {
  ViewerState,
  ViewerActions,
  ViewerStore,
  CameraMode,
  ViewerMode,
  GizmoMode,
  MinimapSize,
  HoverLaneInfo,
} from './store/viewer-types.js';

// Utility functions
export { resolvePositionToWorld } from './utils/position-resolver.js';
export type { WorldCoords, PositionResolveOptions } from './utils/position-resolver.js';
export { roadCoordsToWorld } from './utils/road-projection.js';
export type { RoadProjectionResult } from './utils/road-projection.js';

// Scenario data bridge — extractEntityPositions used by apps/web EditorLayout
export { extractEntityPositions } from './scenario/useEntityPositions.js';

// Route visualization & interaction
export { RouteOverlay } from './route/RouteOverlay.js';
export type { RouteOverlayProps, RouteLaneChangeMarker } from './route/RouteOverlay.js';
export { LaneChangeMarker } from './route/LaneChangeMarker.js';
export { RouteEditOverlay } from './route/RouteEditOverlay.js';
export { RoutePreviewOverlay } from './route/RoutePreviewOverlay.js';
export type { RoutePreviewData, RoutePreviewOverlayProps } from './route/RoutePreviewOverlay.js';
export { RouteClickHandler } from './interaction/RouteClickHandler.js';

// Trajectory visualization & interaction
export { TrajectoryOverlay } from './trajectory/TrajectoryOverlay.js';
export type { TrajectoryOverlayProps } from './trajectory/TrajectoryOverlay.js';
export { TrajectoryEditOverlay } from './trajectory/TrajectoryEditOverlay.js';
export { TrajectoryPreviewOverlay } from './trajectory/TrajectoryPreviewOverlay.js';
export type { TrajectoryPreviewData, TrajectoryPreviewOverlayProps } from './trajectory/TrajectoryPreviewOverlay.js';
export { TrajectoryClickHandler } from './interaction/TrajectoryClickHandler.js';

// Lane-change preview visualization
export { LaneChangePreviewOverlay } from './preview/LaneChangePreviewOverlay.js';
export type {
  LaneChangePreviewData,
  LaneChangePreviewOverlayProps,
} from './preview/LaneChangePreviewOverlay.js';

// Position inspector & pick mode
export { PositionInspectorOverlay } from './interaction/PositionInspectorOverlay.js';
export type { PickedPositionData } from './interaction/RoadClickHandler.js';

// Traffic signal types & utilities (used by apps/web signal panels)
export type { ResolvedSignal, SignalPickModeProps, PickCategory } from './signals/TrafficSignalGroup.js';
export type { PoleAssemblyInfo } from './signals/InstancedPoles.js';
export { classifySignal } from './utils/signal-geometry.js';
export type { SignalCategory } from './utils/signal-geometry.js';

// Signal catalog (types, data, and state parsing for 2D consumers)
export type {
  SignalDescriptor,
  BulbDefinition,
  BulbColor,
  BulbFaceShape,
} from './utils/signal-catalog.js';
export { SIGNAL_CATALOG, resolveSignalDescriptor } from './utils/signal-catalog.js';
export { getBulbMode, hasFlashingBulb, defaultOffState } from './utils/parse-traffic-light-state.js';
export type { BulbMode } from './utils/parse-traffic-light-state.js';

// Shared route/trajectory edit primitives
export { EditPointMarker } from './edit-shared/EditPointMarker.js';
export { EditConnectionLine } from './edit-shared/EditConnectionLine.js';
export { EditPointGizmo } from './edit-shared/EditPointGizmo.js';
export type { EditPointDragResult } from './edit-shared/EditPointGizmo.js';
export { EditPreviewLine, EditPreviewMarker } from './edit-shared/EditPreviewPrimitives.js';
export {
  ROUTE_EDIT_THEME,
  TRAJECTORY_EDIT_THEME,
} from './edit-shared/edit-theme.js';
export type { EditPrimitiveTheme } from './edit-shared/edit-theme.js';

// Road editing math (used by apps/web RoadNetworkEditorLayout)
export { computeAutoArc, computeGeometryEndpoint } from './interaction/road-editing/index.js';
export type { AutoArcResult } from './interaction/road-editing/index.js';
