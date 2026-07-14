/**
 * `features/gt-sim/live` barrel.
 *
 * Cross-cluster contract: cluster F (VD verification) imports `LiveSceneView`
 * (+ its scene types) to drive both live and replay from the same component —
 * see `components/LiveSceneView.tsx` module doc. Import from
 * `@/features/gt-sim/live`.
 */
export { LiveSceneView, type LiveSceneViewProps } from './components/LiveSceneView';
export {
  type OsiObject,
  type TrafficLight,
  type RoadBoundary,
  type RoadGeometry,
  type RoadSign,
  type StopLine,
  type LayerKey,
  DEFAULT_VIEW_RADIUS,
  MIN_VIEW_RADIUS,
  MAX_VIEW_RADIUS,
  ZOOM_FACTOR,
  GRID_SPACING,
  flipY,
  getBoundaryStyle,
  getObjectColors,
  classifySign,
  trafficLightFill,
  speedColor,
  MANEUVER_COLOR,
} from './lib/sceneGeometry';
export { LayerToggle } from './components/LayerToggle';
export { useOsiStream, type HvdData, type OsiConnectionStatus } from './hooks/useOsiStream';
export { useSvStream, type SvConnectionStatus } from './hooks/useSvStream';
export { useFps, type FpsStats } from './hooks/useFps';
export { useLiveViewStore } from './stores/live-view-store';
