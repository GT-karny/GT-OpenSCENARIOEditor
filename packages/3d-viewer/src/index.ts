/**
 * @osce/3d-viewer - Three.js based 3D scenario viewer for OpenSCENARIO editor.
 */

// Main component
export { ScenarioViewer } from './components/ScenarioViewer.js';
export type { ScenarioViewerProps } from './components/ScenarioViewer.js';

// Viewer store (for advanced usage / external control)
export { createViewerStore, useViewerStore } from './store/viewer-store.js';
export type { ViewerState, ViewerActions, ViewerStore, CameraMode, PlaybackState } from './store/viewer-types.js';

// Utility functions (for consumers who want to build custom viewers)
export { getLaneColor } from './utils/lane-type-colors.js';
export { resolvePositionToWorld } from './utils/position-resolver.js';
export type { WorldCoords } from './utils/position-resolver.js';
export { getEntityGeometry, getEntityColor } from './utils/entity-geometry.js';
export type { EntityGeometryParams } from './utils/entity-geometry.js';

// Simulation playback
export { useSimulationPlayback } from './scenario/useSimulationPlayback.js';
export type { SimulationPlaybackControls } from './scenario/useSimulationPlayback.js';

// Scenario data bridge hooks
export { useScenarioEntities } from './scenario/useScenarioEntities.js';
export { useEntityPositions, extractEntityPositions } from './scenario/useEntityPositions.js';

// Sub-components (for composition)
export { RoadNetwork } from './road/RoadNetwork.js';
export { EntityGroup } from './entities/EntityGroup.js';
export { ViewerCanvas } from './scene/ViewerCanvas.js';
export { CameraController } from './scene/CameraController.js';
export { SceneEnvironment } from './scene/SceneEnvironment.js';
