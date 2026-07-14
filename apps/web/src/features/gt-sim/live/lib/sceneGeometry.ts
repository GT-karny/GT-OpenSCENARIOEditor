/**
 * `sceneGeometry` — pure geometry/styling helpers for the 2D live scene.
 *
 * Ported near-verbatim from the GT_Sim fork's `web/frontend/src/lib/sceneGeometry.ts`
 * (React-free, no logic changes — see the migration appendix §F: "描画中核ロジック
 * (`sceneGeometry.ts` 161行 ... )は完全にReact非依存の純TSで無改修移植可").
 *
 * Cross-cluster contract: cluster F (VD verification) imports `LiveSceneView` and
 * therefore these types/helpers too — keep this module's shape stable.
 *
 * Type provenance:
 *  - `OsiObject` / `TrafficLight` are structurally identical to `@osce/esmini`'s
 *    `GtSimOsiObject` / `GtSimOsiTrafficLight` (streaming/types.ts) — re-exported
 *    aliases here so the fork's exact field names keep working without
 *    duplicating the shape.
 *  - `MidLongConstraint` comes straight from `@osce/esmini` (gt-sim-api-types.ts).
 *  - `RoadGeometry` / `RoadBoundary` / `RoadSign` / `StopLine` are local aliases
 *    of `@osce/esmini`'s `RoadGeometryResponse` (and its `signs`/`stop_lines`
 *    fields) so the fork's exact field names keep working here without
 *    duplicating the shape. `RoadGeometryResponse` used to model only
 *    `boundaries`; it now carries `signs`/`stop_lines` as first-class optional
 *    fields, so no widening/cast is needed at the fetch site anymore.
 */
import type {
  GtSimOsiObject,
  GtSimOsiTrafficLight,
  MidLongConstraint,
  RoadGeometryResponse,
  RoadGeometrySign,
  RoadGeometryStopLine,
} from '@osce/esmini';

/* ---------- Scene data types ---------- */

export type OsiObject = GtSimOsiObject;
export type TrafficLight = GtSimOsiTrafficLight;

export type RoadBoundary = RoadGeometryResponse['boundaries'][number];
export type RoadSign = RoadGeometrySign;
export type StopLine = RoadGeometryStopLine;
export type RoadGeometry = RoadGeometryResponse;

export type LayerKey = 'signs' | 'stopLines' | 'signals' | 'vTarget' | 'maneuverMarkers';

/* ---------- Constants ---------- */

export const DEFAULT_VIEW_RADIUS = 50;
export const MIN_VIEW_RADIUS = 10;
export const MAX_VIEW_RADIUS = 500;
export const ZOOM_FACTOR = 1.15; // per wheel tick
export const GRID_SPACING = 10;

/**
 * esmini world (Y-up) -> SVG (Y-down) using a *constant* mapping (svgY = -worldY).
 * A fixed flip keeps static geometry's SVG attributes identical frame-to-frame;
 * only the viewBox moves with the ego, so React can skip reconciling unchanged
 * nodes (see `LiveSceneView` for the grid/road-boundary memoization that relies
 * on this).
 */
export const flipY = (y: number) => -y;

/* ---------- Styling helpers ---------- */

export function getBoundaryStyle(type: string): {
  stroke: string;
  strokeWidth: number;
  dasharray: string;
  opacity: number;
} {
  switch (type) {
    case 'center_line':
      return { stroke: 'rgba(220,200,50,0.7)', strokeWidth: 0.15, dasharray: '', opacity: 0.7 };
    case 'lane_divider':
      return { stroke: 'rgba(220,220,220,0.6)', strokeWidth: 0.12, dasharray: '3 2', opacity: 0.6 };
    case 'road_edge':
      return { stroke: 'rgba(220,220,220,0.8)', strokeWidth: 0.25, dasharray: '', opacity: 0.8 };
    case 'sidewalk_edge':
      return { stroke: 'rgba(160,160,160,0.6)', strokeWidth: 0.2, dasharray: '', opacity: 0.6 };
    default:
      return { stroke: 'rgba(180,180,180,0.4)', strokeWidth: 0.1, dasharray: '', opacity: 0.4 };
  }
}

export function getObjectColors(obj: OsiObject, isEgo: boolean): { fill: string; stroke: string } {
  if (isEgo) {
    return { fill: 'var(--color-primary, #7B88E8)', stroke: 'var(--color-accent-vivid, #9B84E8)' };
  }
  switch (obj.obj_type) {
    case 'pedestrian':
      return { fill: 'rgba(240,160,80,0.7)', stroke: 'rgba(240,160,80,0.9)' };
    case 'animal':
      return { fill: 'rgba(150,150,150,0.5)', stroke: 'rgba(150,150,150,0.7)' };
    case 'vehicle': {
      const vc = obj.vehicle_class;
      if (vc === 'heavy_truck' || vc === 'semitrailer' || vc === 'semitractor' || vc === 'trailer')
        return { fill: 'rgba(200,120,120,0.5)', stroke: 'rgba(200,120,120,0.7)' };
      if (vc === 'bus' || vc === 'tram' || vc === 'train')
        return { fill: 'rgba(120,180,200,0.5)', stroke: 'rgba(120,180,200,0.7)' };
      if (vc === 'bicycle' || vc === 'motorbike' || vc === 'standup_scooter')
        return { fill: 'rgba(120,200,120,0.6)', stroke: 'rgba(120,200,120,0.8)' };
      return { fill: 'rgba(180,170,230,0.25)', stroke: 'rgba(180,170,230,0.45)' };
    }
    default:
      return { fill: 'rgba(150,150,150,0.3)', stroke: 'rgba(150,150,150,0.5)' };
  }
}

/* ---------- Mid/long maneuver colours ---------- */

export const MANEUVER_COLOR: Record<MidLongConstraint['kind'], string> = {
  curve: '#E8A24F',
  junction: '#E0568A',
  speed_limit: '#4F9DE8',
  stop: '#E03131',
};

/* ---------- Environment classification / colour helpers ---------- */

// Best-effort sign classification from the OpenDRIVE name (RM_RoadSign has no
// OSI type). Falls back to a neutral marker.
export function classifySign(name: string): { kind: 'stop' | 'yield' | 'other'; color: string } {
  const n = name.toLowerCase();
  if (n.includes('stop')) return { kind: 'stop', color: 'rgb(220,60,60)' };
  if (n.includes('yield') || n.includes('give') || n.includes('giveway')) {
    return { kind: 'yield', color: 'rgb(235,180,60)' };
  }
  return { kind: 'other', color: 'rgb(150,160,200)' };
}

export function trafficLightFill(color: string): string {
  switch (color) {
    case 'red':
      return 'rgb(235,50,50)';
    case 'yellow':
      return 'rgb(240,200,50)';
    case 'green':
      return 'rgb(60,210,90)';
    default:
      return 'rgb(160,160,160)';
  }
}

export function speedColor(frac: number): string {
  const f = Math.max(0, Math.min(1, frac));
  // slow (green) -> fast (red)
  const r = Math.round(80 + (235 - 80) * f);
  const g = Math.round(210 + (90 - 210) * f);
  const b = Math.round(140 + (90 - 140) * f);
  return `rgb(${r},${g},${b})`;
}
