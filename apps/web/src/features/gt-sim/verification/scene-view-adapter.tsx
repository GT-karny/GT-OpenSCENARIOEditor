/**
 * Scene rendering adapter for verification (`ReplayView`, `AnnotateView`,
 * `LiveVdPanel`): renders cluster E's `LiveSceneView` (`features/gt-sim/live`),
 * the shared 2D ego-centered scene renderer that both live and
 * replay/annotate drive from the same `VdTelemetryFrame`-shaped props (see
 * `LiveSceneView`'s module doc, appendix §F: "ライブとリプレイは同一フレーム
 * 形状で同じLiveSceneView/チャート群を駆動する設計(合流点はprops)").
 *
 * Kept as a thin wrapper (not a bare re-export) so this cluster's props type
 * name (`SceneViewAdapterProps`) — and its `RoadGeometryResponse`-typed
 * `roadGeometry` (the frozen `@osce/esmini` wire contract, which now carries
 * optional `signs`/`stop_lines`) — stays the stable local surface the
 * verification call sites depend on, independent of `LiveSceneView`'s own
 * (structurally identical) locally-widened `RoadGeometry` prop type.
 */
import type {
  GtSimOsiObject,
  GtSimOsiTrafficLight,
  MidLongProfile,
  RoadGeometryResponse,
  VdTelemetryFrame,
} from '@osce/esmini';
import { LiveSceneView } from '../live';

export interface SceneViewAdapterProps {
  objects: GtSimOsiObject[];
  roadGeometry?: RoadGeometryResponse | null;
  trafficLights?: GtSimOsiTrafficLight[];
  /** Current VirtualDriver telemetry frame (replay or live) -> short-horizon preview overlay. */
  vdTelemetry?: VdTelemetryFrame | null;
  /** Mid/long planner output (Phase 2) -> v_target labels + maneuver markers. */
  midlong?: MidLongProfile | null;
  /** Baseline (Default) ego path for 2-run comparison, as world [x,y] points. */
  ghostPath?: [number, number][] | null;
  className?: string;
  viewRadius?: number;
}

export function SceneViewAdapter(props: SceneViewAdapterProps) {
  return <LiveSceneView {...props} />;
}
