/**
 * `LiveSceneView` — the 2D ego-centered scene (12 draw layers: road boundaries,
 * grid, stop lines, objects, ego, ghost path, VD preview, v_target labels,
 * maneuver markers, signs, traffic lights, empty state) + 5 layer toggles.
 *
 * Ported from the fork's `components/LiveSceneView.tsx`. **Cross-cluster
 * contract**: cluster F (VD verification) imports this component to drive both
 * live and replay from the same props — the props shape below is the fork's
 * exact merge point (appendix §F: "ライブとリプレイは同一フレーム形状で同じ
 * LiveSceneView/チャート群を駆動する設計(合流点はprops)"). Do not change this
 * shape without coordinating with cluster F.
 *
 * Only import sources changed (this lane's `sceneGeometry`/`sceneLayers`,
 * `@osce/esmini` types) and the "Waiting for data..." string is now i18n
 * (`gtSim.live.sceneWaiting`). Rendering logic is otherwise unmodified.
 */
import { useCallback, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from '@osce/i18n';
import type { MidLongProfile, VdTelemetryFrame } from '@osce/esmini';
import {
  type LayerKey,
  type OsiObject,
  type RoadGeometry,
  type TrafficLight,
  DEFAULT_VIEW_RADIUS,
  GRID_SPACING,
  MAX_VIEW_RADIUS,
  MIN_VIEW_RADIUS,
  ZOOM_FACTOR,
  flipY,
  getBoundaryStyle,
} from '../lib/sceneGeometry';
import { LayerToggle } from './LayerToggle';
import {
  renderManeuverMarker,
  renderObject,
  renderSign,
  renderTrafficLights,
  renderVdPreview,
} from '../lib/sceneLayers';

// Re-exported for consumers (e.g. cluster F) that import scene types from this module.
export type { RoadBoundary, RoadGeometry, RoadSign, StopLine } from '../lib/sceneGeometry';

export interface LiveSceneViewProps {
  objects: OsiObject[];
  roadGeometry?: RoadGeometry | null;
  trafficLights?: TrafficLight[];
  /** Current VirtualDriver telemetry frame (replay or live) -> short-horizon preview overlay. */
  vdTelemetry?: VdTelemetryFrame | null;
  /** Mid/long planner output (Phase 2) -> v_target labels + maneuver markers. */
  midlong?: MidLongProfile | null;
  /** Baseline (Default) ego path for 2-run comparison, as world [x,y] points. */
  ghostPath?: [number, number][] | null;
  className?: string;
  viewRadius?: number;
}

/* ---------- Component ---------- */

export function LiveSceneView({
  objects,
  roadGeometry,
  trafficLights,
  vdTelemetry,
  midlong,
  ghostPath,
  className = '',
  viewRadius: initialRadius = DEFAULT_VIEW_RADIUS,
}: LiveSceneViewProps) {
  const { t } = useTranslation('common');
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1); // >1 = zoomed in, <1 = zoomed out
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    signs: true,
    stopLines: true,
    signals: true,
    vTarget: true,
    maneuverMarkers: true,
  });

  const viewRadius = initialRadius / zoom;

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      setZoom((prev) => {
        const next = e.deltaY < 0 ? prev * ZOOM_FACTOR : prev / ZOOM_FACTOR;
        const minZoom = initialRadius / MAX_VIEW_RADIUS;
        const maxZoom = initialRadius / MIN_VIEW_RADIUS;
        return Math.max(minZoom, Math.min(maxZoom, next));
      });
    },
    [initialRadius],
  );

  // Ego = first MovingObject in OSI list (index 0)
  const ego = useMemo(() => (objects.length > 0 ? objects[0] : null), [objects]);

  // Ego-centered viewport
  const viewport = useMemo(() => {
    if (ego) return { cx: ego.x, cy: ego.y };
    return { cx: 0, cy: 0 };
  }, [ego]);

  const minX = viewport.cx - viewRadius;
  const maxX = viewport.cx + viewRadius;
  const minY = viewport.cy - viewRadius;
  const maxY = viewport.cy + viewRadius;
  const size = viewRadius * 2;

  // Grid is rebuilt only when the camera crosses a grid cell (hysteresis), not
  // every frame. Quantising the viewport bounds to GRID_SPACING keeps these
  // deps stable across the ~10m of travel between cells, so the grid memo (and
  // its SVG nodes) stay reconciliation-free while the ego moves smoothly.
  const gMinX = Math.floor(minX / GRID_SPACING) * GRID_SPACING;
  const gMaxX = Math.ceil(maxX / GRID_SPACING) * GRID_SPACING;
  const gMinY = Math.floor(minY / GRID_SPACING) * GRID_SPACING;
  const gMaxY = Math.ceil(maxY / GRID_SPACING) * GRID_SPACING;

  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let x = gMinX; x <= gMaxX; x += GRID_SPACING) {
      lines.push({ x1: x, y1: flipY(gMaxY), x2: x, y2: flipY(gMinY) });
    }
    for (let y = gMinY; y <= gMaxY; y += GRID_SPACING) {
      lines.push({ x1: gMinX, y1: flipY(y), x2: gMaxX, y2: flipY(y) });
    }
    return lines;
  }, [gMinX, gMaxX, gMinY, gMaxY]);

  // Road boundaries: rendered once in a fixed world frame (constant Y-flip),
  // independent of the camera. Panning/zooming is done purely via the SVG
  // viewBox below, so these path nodes never change attributes frame-to-frame
  // and React skips reconciling them. (For very large networks, swap the full
  // render for a hysteresis-clipped subset — see plan risks.)
  const roadPaths = useMemo(() => {
    if (!roadGeometry) return null;
    return roadGeometry.boundaries.map((boundary, idx) => {
      if (boundary.points.length < 2) return null;
      const d = boundary.points
        .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px},${flipY(py)}`)
        .join(' ');
      const style = getBoundaryStyle(boundary.type);

      return (
        <path
          key={`road-${idx}`}
          d={d}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.dasharray || undefined}
          opacity={style.opacity}
        />
      );
    });
  }, [roadGeometry]);

  // Split objects: non-ego rendered first, ego (first object) on top
  const egoId = ego?.id;
  const nonEgo = useMemo(() => (egoId != null ? objects.slice(1) : objects), [objects, egoId]);

  // Static environment layers (camera-independent, constant Y-flip → stable nodes)
  const stopLinePaths = useMemo(() => {
    const lines = roadGeometry?.stop_lines;
    if (!lines || lines.length === 0) return null;
    return lines.map((line, idx) => {
      if (line.points.length < 2) return null;
      const d = line.points
        .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px},${flipY(py)}`)
        .join(' ');
      return (
        <path
          key={`stop-${line.road_id}-${line.sign_id}-${idx}`}
          d={d}
          fill="none"
          stroke="rgba(245,245,245,0.85)"
          strokeWidth={0.35}
          strokeLinecap="round"
        />
      );
    });
  }, [roadGeometry]);

  const signMarkers = useMemo(() => {
    const signs = roadGeometry?.signs;
    if (!signs || signs.length === 0) return null;
    return signs.map((sign) => renderSign(sign, flipY));
  }, [roadGeometry]);

  // Traffic-light phase comes live from the OSI WS stream (per-frame).
  const signalNodes = useMemo(
    () => (trafficLights && trafficLights.length > 0 ? renderTrafficLights(trafficLights, flipY) : null),
    [trafficLights],
  );

  // VirtualDriver short-horizon preview (speed-coloured polyline + sample dots).
  const vdPreview = useMemo(
    () => (vdTelemetry?.preview?.points?.length ? renderVdPreview(vdTelemetry, flipY) : null),
    [vdTelemetry],
  );

  // v_target speed labels along the short-horizon preview (no A2 dependency:
  // the profile is in route-s with no XY, so the spatial readout reuses the
  // preview sample points which already carry XY + target speed v).
  const vTargetLabels = useMemo(() => {
    const pts = vdTelemetry?.preview?.points;
    if (!pts || pts.length < 2) return null;
    const step = Math.max(1, Math.floor(pts.length / 5));
    const out: ReactElement[] = [];
    for (let i = step; i < pts.length; i += step) {
      const p = pts[i];
      out.push(
        <text
          key={`vt${i}`}
          x={p.x + 0.6}
          y={flipY(p.y)}
          fontSize={1.6}
          fill="rgba(120,210,150,0.9)"
          fontFamily="var(--font-mono, monospace)"
        >
          {p.v.toFixed(0)}
        </text>,
      );
    }
    return out;
  }, [vdTelemetry]);

  // Mid/long maneuver markers at constraint world XY (curve / junction / speed
  // limit). [A2] Driven by midlong.constraints, which carry real XY; null until
  // A2 emits them.
  const maneuverMarkersNode = useMemo(() => {
    const cs = midlong?.valid ? midlong.constraints : undefined;
    if (!cs || cs.length === 0) return null;
    return cs.map((c, i) => renderManeuverMarker(c, flipY, i));
  }, [midlong]);

  // Baseline (Default) ghost path for 2-run comparison.
  const ghostPathNode = useMemo(() => {
    if (!ghostPath || ghostPath.length < 2) return null;
    const d = ghostPath.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px},${flipY(py)}`).join(' ');
    return (
      <path
        d={d}
        fill="none"
        stroke="rgba(230,200,120,0.5)"
        strokeWidth={0.25}
        strokeDasharray="1.5 1.2"
      />
    );
  }, [ghostPath]);

  const hasSigns = (roadGeometry?.signs?.length ?? 0) > 0;
  const hasStopLines = (roadGeometry?.stop_lines?.length ?? 0) > 0;
  const hasSignals = (trafficLights?.length ?? 0) > 0;
  const hasVdPreview = (vdTelemetry?.preview?.points?.length ?? 0) > 0;
  const hasManeuver = !!(midlong?.valid && (midlong.constraints?.length ?? 0) > 0);
  const showLayerBar = hasSigns || hasStopLines || hasSignals || hasVdPreview || hasManeuver;

  return (
    <div className={`relative ${className}`}>
      {showLayerBar && (
        <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
          {hasSignals && (
            <LayerToggle
              label={t('gtSim.live.layers.signals')}
              active={layers.signals}
              onClick={() => setLayers((l) => ({ ...l, signals: !l.signals }))}
            />
          )}
          {hasSigns && (
            <LayerToggle
              label={t('gtSim.live.layers.signs')}
              active={layers.signs}
              onClick={() => setLayers((l) => ({ ...l, signs: !l.signs }))}
            />
          )}
          {hasStopLines && (
            <LayerToggle
              label={t('gtSim.live.layers.stopLines')}
              active={layers.stopLines}
              onClick={() => setLayers((l) => ({ ...l, stopLines: !l.stopLines }))}
            />
          )}
          {hasVdPreview && (
            <LayerToggle
              label={t('gtSim.live.layers.vTarget')}
              active={layers.vTarget}
              onClick={() => setLayers((l) => ({ ...l, vTarget: !l.vTarget }))}
            />
          )}
          {hasManeuver && (
            <LayerToggle
              label={t('gtSim.live.layers.maneuver')}
              active={layers.maneuverMarkers}
              onClick={() => setLayers((l) => ({ ...l, maneuverMarkers: !l.maneuverMarkers }))}
            />
          )}
        </div>
      )}
      {renderScene()}
    </div>
  );

  function renderScene() {
    return (
      <svg
        ref={svgRef}
        viewBox={`${minX} ${flipY(maxY)} ${size} ${size}`}
        className="w-full h-full block"
        style={{ background: 'var(--color-glass-1, rgba(18,12,48,0.35))' }}
        onWheel={handleWheel}
      >
        {/* Road boundaries */}
        {roadPaths}

        {/* Grid */}
        {gridLines.map((line, i) => (
          <line
            key={`g${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--color-glass-edge, rgba(180,170,230,0.07))"
            strokeWidth={0.3}
            opacity={0.3}
          />
        ))}

        {/* Stop lines (static, from road geometry) */}
        {layers.stopLines && stopLinePaths}

        {/* Non-ego objects */}
        {nonEgo.map((obj) => renderObject(obj, flipY, false))}

        {/* Ego vehicle (on top) */}
        {ego && renderObject(ego, flipY, true)}

        {/* Baseline ghost path (faint, under everything dynamic) */}
        {ghostPathNode}

        {/* VirtualDriver preview trajectory (under markers, over road) */}
        {vdPreview}
        {layers.vTarget && vTargetLabels}

        {/* Mid/long maneuver markers (curve / junction / speed-limit preview) */}
        {layers.maneuverMarkers && maneuverMarkersNode}

        {/* Signs + traffic-light heads (on top of vehicles) */}
        {layers.signs && signMarkers}
        {layers.signals && signalNodes}

        {/* Empty state */}
        {objects.length === 0 && (
          <text
            x={viewport.cx}
            y={flipY(viewport.cy)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-text-secondary, #aaa)"
            fontSize={3}
            fontFamily="var(--font-body, sans-serif)"
          >
            {t('gtSim.live.sceneWaiting')}
          </text>
        )}
      </svg>
    );
  }
}
