/**
 * v_target(s) profile chart (Phase 2 mid/long planner). Ported unchanged
 * (logic) from the fork's `components/verification/VTargetProfileChart.tsx`,
 * restyled with APEX tokens.
 *
 * x-axis = route s [m], y-axis = speed [m/s]. Overlays:
 *   - actual ego speed vs accumulated route-s (from frame history),
 *   - the planner's v_target(s) curve (from the current frame's midlong),
 *   - the scan range and labelled constraint points,
 *   - a playhead at the current ego route-s.
 *
 * Hand-coded SVG (no charting lib) to match ErrorChart in TelemetryPanels.tsx
 * — the fork's own convention for these panels; a new charting dependency is
 * out of scope for this port.
 * Degrades to actual-speed-only when `midlong` is absent/invalid (pre-Phase-2).
 */
import { useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type { MidLongProfile, VdTelemetryFrame } from '@osce/esmini';
import { MID_LONG_CONSTRAINT_COLOR as KIND_COLOR } from '../../lib/colors';

/** Accumulate per-road `ego.s` (which resets at road boundaries) into a
 *  monotonic route-s. Falls back to sim_time if any frame lacks `ego.s`. */
function routeSeries(frames: VdTelemetryFrame[]): { s: number[]; usingTime: boolean } {
  const haveS = frames.every((f) => typeof f.ego.s === 'number');
  if (!haveS) return { s: frames.map((f) => f.sim_time), usingTime: true };
  const out: number[] = [];
  let carry = 0;
  let prev = frames.length ? (frames[0].ego.s as number) : 0;
  for (const f of frames) {
    const s = f.ego.s as number;
    if (s < prev - 1) carry += prev; // crossed onto a new road -> add previous road length
    out.push(carry + s);
    prev = s;
  }
  return { s: out, usingTime: false };
}

export function VTargetProfileChart({
  frames,
  idx,
  midlong,
}: {
  frames: VdTelemetryFrame[];
  idx: number;
  midlong?: MidLongProfile | null;
}) {
  const { t } = useTranslation('common');
  const W = 264,
    H = 120,
    padL = 4,
    padR = 4,
    padT = 6,
    padB = 6;
  const hasProfile = !!(midlong && midlong.valid && midlong.v_target_profile.length);

  const model = useMemo(() => {
    if (!frames.length) return null;
    const { s: routeS, usingTime } = routeSeries(frames);
    const speeds = frames.map((f) => f.ego.speed);
    const cursor = Math.max(0, Math.min(idx, frames.length - 1));
    const egoS = routeS[cursor];

    // v_target_profile / constraints carry s = forward distance from the *current*
    // ego position; shift them onto the absolute route-s axis the actual-speed
    // line uses. Skip when the x-axis falls back to time (a distance profile
    // cannot be aligned to a time axis).
    const showProfile = hasProfile && !usingTime;
    const profile = (showProfile ? midlong!.v_target_profile : []).map(
      ([fd, v]) => [egoS + fd, v] as [number, number],
    );
    const constraints = (showProfile ? (midlong!.constraints ?? []) : []).map((c) => ({
      ...c,
      s: egoS + c.s,
    }));

    const sVals = [...routeS, ...profile.map((p) => p[0]), ...constraints.map((c) => c.s)];
    const sMin = Math.min(...sVals);
    const sMax = Math.max(sMin + 1e-3, ...sVals);
    const vMax = Math.max(0.1, ...speeds, ...profile.map((p) => p[1]));

    const x = (s: number) => padL + ((s - sMin) / (sMax - sMin)) * (W - padL - padR);
    const y = (v: number) => padT + (1 - v / vMax) * (H - padT - padB);

    const line = (pts: [number, number][]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');

    const actualPath = line(routeS.map((s, i) => [s, speeds[i]] as [number, number]));
    const targetPath = profile.length ? line(profile) : '';
    const profileEndS = profile.length ? profile[profile.length - 1][0] : egoS;

    return { x, y, actualPath, targetPath, constraints, egoS, profileEndS, vMax, usingTime, showProfile };
  }, [frames, idx, midlong, hasProfile]);

  if (!model) return null;

  return (
    <div className="border border-[var(--color-glass-edge)] p-2">
      <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1 flex gap-3">
        <span>
          <span className="inline-block w-2 h-2 rounded-none mr-1" style={{ background: '#7B88E8' }} />
          {t('gtSim.vd.charts.actualSpeed')}
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-none mr-1" style={{ background: '#4FD18B' }} />
          v_target(s)
        </span>
        <span className="ml-auto">
          {model.usingTime ? t('gtSim.vd.charts.xTime') : t('gtSim.vd.charts.xRouteS')} · {model.vMax.toFixed(1)} m/s
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* scan range (ego -> end of v_target horizon) */}
        {model.showProfile && (
          <rect
            x={model.x(model.egoS)}
            y={padT}
            width={Math.max(0, model.x(model.profileEndS) - model.x(model.egoS))}
            height={H - padT - padB}
            fill="rgba(79,209,139,0.07)"
          />
        )}
        {/* constraint markers */}
        {model.constraints.map((c, i) => (
          <g key={i}>
            <line
              x1={model.x(c.s)}
              y1={padT}
              x2={model.x(c.s)}
              y2={H - padB}
              stroke={KIND_COLOR[c.kind]}
              strokeWidth={0.8}
              strokeDasharray="2 2"
              opacity={0.7}
            />
            <circle cx={model.x(c.s)} cy={model.y(c.v)} r={2.2} fill={KIND_COLOR[c.kind]} />
          </g>
        ))}
        {/* actual speed */}
        <path d={model.actualPath} fill="none" stroke="#7B88E8" strokeWidth={1} />
        {/* v_target curve */}
        {model.targetPath && <path d={model.targetPath} fill="none" stroke="#4FD18B" strokeWidth={1.2} />}
        {/* playhead at current ego route-s */}
        <line
          x1={model.x(model.egoS)}
          y1={padT}
          x2={model.x(model.egoS)}
          y2={H - padB}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={0.8}
        />
        {!hasProfile && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={9} fill="rgba(180,170,230,0.6)">
            {t('gtSim.vd.charts.vTargetPending')}
          </text>
        )}
      </svg>
    </div>
  );
}
