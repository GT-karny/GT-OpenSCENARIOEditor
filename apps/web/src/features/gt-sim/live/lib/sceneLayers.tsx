/**
 * `sceneLayers` — SVG renderers for the 2D live scene's overlay layers.
 *
 * Ported near-verbatim from the fork's
 * `web/frontend/src/components/liveScene/sceneLayers.tsx` (12 draw layers per
 * the migration appendix §F). Logic unchanged; only import sources adjusted to
 * this lane's `sceneGeometry` module and `@osce/esmini` types.
 */
import type { ReactElement } from 'react';
import type { MidLongConstraint, VdTelemetryFrame } from '@osce/esmini';
import {
  type OsiObject,
  type RoadSign,
  type TrafficLight,
  MANEUVER_COLOR,
  classifySign,
  getObjectColors,
  speedColor,
  trafficLightFill,
} from './sceneGeometry';

/* ---------- Mid/long maneuver markers ---------- */

// Diamond marker at the constraint's world XY with kind + target speed label.
export function renderManeuverMarker(
  c: MidLongConstraint,
  toSvgY: (y: number) => number,
  key: number,
): ReactElement {
  const cx = c.x;
  const cy = toSvgY(c.y);
  const color = MANEUVER_COLOR[c.kind] ?? '#9B84E8';
  const r = 1.4;
  return (
    <g key={`mm${key}`}>
      <path
        d={`M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z`}
        fill="none"
        stroke={color}
        strokeWidth={0.3}
      />
      <circle cx={cx} cy={cy} r={0.3} fill={color} />
      <text
        x={cx + r + 0.4}
        y={cy}
        fontSize={1.6}
        fill={color}
        dominantBaseline="central"
        fontFamily="var(--font-mono, monospace)"
      >
        {c.kind} {c.v.toFixed(0)}
      </text>
    </g>
  );
}

/* ---------- Environment renderers ---------- */

export function renderSign(sign: RoadSign, toSvgY: (y: number) => number): ReactElement {
  const sx = sign.x;
  const sy = toSvgY(sign.y);
  const { kind, color } = classifySign(sign.name);
  const r = 1.0;

  let shape: ReactElement;
  if (kind === 'stop') {
    // Octagon
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
    shape = <polygon points={pts} fill={color} stroke="white" strokeWidth={0.12} />;
  } else if (kind === 'yield') {
    // Inverted triangle
    shape = (
      <polygon
        points={`${-r},${-r * 0.8} ${r},${-r * 0.8} 0,${r}`}
        fill={color}
        stroke="white"
        strokeWidth={0.12}
      />
    );
  } else {
    shape = <circle r={r * 0.8} fill={color} stroke="white" strokeWidth={0.12} />;
  }

  return (
    <g key={`sign-${sign.road_id}-${sign.id}`} transform={`translate(${sx}, ${sy})`}>
      {shape}
      {sign.name && (
        <text
          x={0}
          y={-r - 0.4}
          textAnchor="middle"
          fill="var(--color-text-secondary, #aaa)"
          fontSize={1.0}
          fontFamily="var(--font-body, sans-serif)"
        >
          {sign.name}
        </text>
      )}
    </g>
  );
}

// Each lamp is a separate TrafficLight at (nearly) the same x,y. Render inactive
// lamps first as dim rings, then active (mode != off/unknown) on top so the live
// phase colour is always visible regardless of array order.
export function renderTrafficLights(
  lights: TrafficLight[],
  toSvgY: (y: number) => number,
): ReactElement {
  const isActive = (l: TrafficLight) =>
    l.mode === 'constant' || l.mode === 'flashing' || l.mode === 'counting';
  const inactive = lights.filter((l) => !isActive(l));
  const active = lights.filter(isActive);

  return (
    <g>
      {inactive.map((l) => (
        <circle
          key={`tl-off-${l.id}`}
          cx={l.x}
          cy={toSvgY(l.y)}
          r={0.6}
          fill="none"
          stroke="rgba(150,150,150,0.5)"
          strokeWidth={0.15}
        />
      ))}
      {active.map((l) => (
        <circle
          key={`tl-on-${l.id}`}
          cx={l.x}
          cy={toSvgY(l.y)}
          r={0.8}
          fill={trafficLightFill(l.color)}
          stroke="white"
          strokeWidth={0.12}
          opacity={l.mode === 'flashing' ? 0.7 : 0.95}
        />
      ))}
    </g>
  );
}

// VirtualDriver short-horizon trajectory preview: polyline coloured by target
// speed, with sample dots. (x,y,v,t) come straight from GT_GetVirtualDriverTelemetry.
export function renderVdPreview(tel: VdTelemetryFrame, toSvgY: (y: number) => number): ReactElement {
  const pts = tel.preview.points;
  const vmax = Math.max(0.001, ...pts.map((p) => p.v));
  const segs: ReactElement[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    segs.push(
      <line
        key={`vdseg-${i}`}
        x1={a.x}
        y1={toSvgY(a.y)}
        x2={b.x}
        y2={toSvgY(b.y)}
        stroke={speedColor((a.v + b.v) / 2 / vmax)}
        strokeWidth={0.4}
        strokeLinecap="round"
        opacity={0.9}
      />,
    );
  }
  return (
    <g>
      {segs}
      {pts.map((p, i) => (
        <circle key={`vdpt-${i}`} cx={p.x} cy={toSvgY(p.y)} r={0.16} fill="rgba(255,255,255,0.75)" />
      ))}
    </g>
  );
}

/* ---------- Object renderers ---------- */

export function renderObject(obj: OsiObject, toSvgY: (y: number) => number, isEgo: boolean) {
  const svgY = toSvgY(obj.y);
  const angleDeg = (-obj.h * 180) / Math.PI;
  const { fill, stroke } = getObjectColors(obj, isEgo);

  // Actual dimensions from OSI (with fallbacks)
  const length = obj.length > 0 ? obj.length : 4.0;
  const width = obj.width > 0 ? obj.width : 2.0;

  return (
    <g key={obj.id} transform={`translate(${obj.x}, ${svgY}) rotate(${angleDeg})`}>
      {renderShape(obj, length, width, fill, stroke, isEgo)}

      {/* Heading indicator for vehicles */}
      {(obj.obj_type === 'vehicle' || obj.obj_type === '' || obj.obj_type === 'unknown') && (
        <polygon
          points={`${length / 2},0 ${length / 2 - 0.8},-0.6 ${length / 2 - 0.8},0.6`}
          fill={isEgo ? 'var(--color-accent-bright, #D0C6F2)' : 'rgba(180,170,230,0.3)'}
        />
      )}

      {/* Name label */}
      <text
        x={0}
        y={-Math.max(width, 1) / 2 - 0.6}
        textAnchor="middle"
        fill="var(--color-text-secondary, #aaa)"
        fontSize={1.2}
        fontFamily="var(--font-body, sans-serif)"
      >
        {obj.name || obj.id}
      </text>
    </g>
  );
}

function renderShape(
  obj: OsiObject,
  length: number,
  width: number,
  fill: string,
  stroke: string,
  isEgo: boolean,
): ReactElement {
  switch (obj.obj_type) {
    case 'pedestrian': {
      const r = Math.max(0.3, width / 2);
      return <circle cx={0} cy={0} r={r} fill={fill} stroke={stroke} strokeWidth={isEgo ? 0.15 : 0.1} />;
    }

    case 'vehicle': {
      const vc = obj.vehicle_class;
      const isTwoWheeler = vc === 'bicycle' || vc === 'motorbike' || vc === 'standup_scooter';
      if (isTwoWheeler) {
        return (
          <ellipse
            cx={0}
            cy={0}
            rx={length / 2}
            ry={width / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={0.1}
          />
        );
      }
      return (
        <rect
          x={-length / 2}
          y={-width / 2}
          width={length}
          height={width}
          rx={0.3}
          fill={fill}
          stroke={stroke}
          strokeWidth={isEgo ? 0.2 : 0.12}
          opacity={isEgo ? 0.9 : 0.75}
        />
      );
    }

    case 'animal': {
      const s = Math.max(0.5, length / 2);
      return (
        <polygon
          points={`${s},0 0,${s * 0.6} ${-s},0 0,${-s * 0.6}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={0.1}
        />
      );
    }

    default:
      // Unknown / other / legacy (no obj_type field)
      return (
        <rect
          x={-length / 2}
          y={-width / 2}
          width={length}
          height={width}
          rx={0.3}
          fill={fill}
          stroke={stroke}
          strokeWidth={isEgo ? 0.2 : 0.12}
          opacity={isEgo ? 0.9 : 0.7}
        />
      );
  }
}
