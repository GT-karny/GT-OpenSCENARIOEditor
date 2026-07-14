/**
 * Pure replay-support functions for the VD verification cluster (replay +
 * annotate). No React — unit-testable directly and reused by both
 * `hooks/useSceneReplay.ts` (nearest-scene-frame lookup) and the Timeline /
 * event-marker UI.
 *
 * `findNearestByTime` mirrors the fork's inline binary search in
 * `components/verification/replayHooks.ts` `useSceneReplay` (recorded scene
 * frames are sparser than telemetry frames, so the nearest one by `sim_time`
 * is picked for each telemetry frame during replay).
 */
import type { VdTelemetryFrame } from '@osce/esmini';

export interface TimedFrame {
  sim_time: number;
}

/**
 * Binary search for the frame nearest to `t` in a `sim_time`-ascending array.
 * Returns `null` for an empty array. `frames` must already be sorted by
 * `sim_time` ascending (recorded runs and streams both satisfy this).
 */
export function findNearestByTime<T extends TimedFrame>(frames: T[], t: number): T | null {
  if (frames.length === 0) return null;
  let lo = 0;
  let hi = frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].sim_time <= t) lo = mid;
    else hi = mid;
  }
  return Math.abs(frames[lo].sim_time - t) <= Math.abs(frames[hi].sim_time - t)
    ? frames[lo]
    : frames[hi];
}

/**
 * Event-marker kind. Carries no display string — the marker holds the kind +
 * parameters (lane from/to) and the UI (`ReplayTransport`'s `Timeline`)
 * resolves the i18n label. The fork baked English labels into the marker;
 * that leaked untranslated text into tooltips.
 */
export type EventMarkerKind = 'start' | 'stop' | 'lane' | 'override_on' | 'override_off';

export interface EventMarker {
  idx: number;
  t: number;
  kind: EventMarkerKind;
  color: string;
  /** Lane-change parameters (`kind === 'lane'` only). */
  laneFrom?: number;
  laneTo?: number;
}

/**
 * Detect start / stop / lane-change / override transitions across a
 * VirtualDriver telemetry run, for the Timeline scrubber's event markers.
 * Detection logic ported unchanged from the fork's `useSceneReplay` inline
 * `events` builder; markers carry kind + params instead of label strings.
 */
export function buildEventMarkers(frames: VdTelemetryFrame[]): EventMarker[] {
  const out: EventMarker[] = [];
  let moving = false;
  let prevLane: number | null | undefined = undefined;
  let prevOverride = false;
  frames.forEach((f, i) => {
    const sp = f.ego.speed;
    if (!moving && sp > 0.8) {
      moving = true;
      if (i > 0) out.push({ idx: i, t: f.sim_time, kind: 'start', color: '#4FD18B' });
    } else if (moving && sp < 0.3) {
      moving = false;
      out.push({ idx: i, t: f.sim_time, kind: 'stop', color: '#E8884F' });
    }
    const lane = f.ego.lane;
    if (prevLane != null && lane != null && lane !== prevLane) {
      out.push({
        idx: i,
        t: f.sim_time,
        kind: 'lane',
        color: '#7B88E8',
        laneFrom: prevLane,
        laneTo: lane,
      });
    }
    if (lane != null) prevLane = lane;
    const ov = f.override.lateral || f.override.longitudinal;
    if (ov !== prevOverride) {
      out.push({
        idx: i,
        t: f.sim_time,
        kind: ov ? 'override_on' : 'override_off',
        color: '#E8C84F',
      });
    }
    prevOverride = ov;
  });
  return out;
}
