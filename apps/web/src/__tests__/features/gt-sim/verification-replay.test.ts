import { describe, it, expect } from 'vitest';
import type { VdTelemetryFrame } from '@osce/esmini';
import { buildEventMarkers, findNearestByTime } from '../../../features/gt-sim/verification/lib/replay';

describe('findNearestByTime', () => {
  it('returns null for an empty array', () => {
    expect(findNearestByTime([], 5)).toBeNull();
  });

  it('returns the only element for a single-element array', () => {
    const frames = [{ sim_time: 3 }];
    expect(findNearestByTime(frames, 999)).toBe(frames[0]);
  });

  it('finds the exact match when the query time lands on a frame', () => {
    const frames = [{ sim_time: 0 }, { sim_time: 1 }, { sim_time: 2 }, { sim_time: 3 }];
    expect(findNearestByTime(frames, 2)).toBe(frames[2]);
  });

  it('picks the nearer neighbor when the query time falls between frames', () => {
    const frames = [{ sim_time: 0 }, { sim_time: 1 }, { sim_time: 2 }, { sim_time: 10 }];
    // 1.2 is nearer to 1 than to 2.
    expect(findNearestByTime(frames, 1.2)).toBe(frames[1]);
    // 1.8 is nearer to 2 than to 1.
    expect(findNearestByTime(frames, 1.8)).toBe(frames[2]);
    // Ties resolve to the lower (earlier) frame per the bisection's <= comparison.
    expect(findNearestByTime(frames, 1.5)).toBe(frames[1]);
  });

  it('clamps to the first/last frame for out-of-range queries', () => {
    const frames = [{ sim_time: 5 }, { sim_time: 6 }, { sim_time: 7 }];
    expect(findNearestByTime(frames, -100)).toBe(frames[0]);
    expect(findNearestByTime(frames, 100)).toBe(frames[2]);
  });

  it('finds the nearest frame in a larger sparse array (binary search correctness)', () => {
    // 50 frames at t = 0, 2, 4, ... 98 (sparser than a query set, like recorded
    // OSI scene frames vs. dense VD telemetry).
    const frames = Array.from({ length: 50 }, (_, i) => ({ sim_time: i * 2 }));
    expect(findNearestByTime(frames, 37)).toBe(frames[18]); // tie between t=36/38 -> lower wins
    expect(findNearestByTime(frames, 39)).toBe(frames[19]); // tie between t=38/40 -> lower wins
  });
});

function egoFrame(overrides: Partial<VdTelemetryFrame['ego']> & { sim_time: number; overrideOn?: boolean }): VdTelemetryFrame {
  const { sim_time, overrideOn, ...ego } = overrides;
  return {
    sim_time,
    ego: { x: 0, y: 0, z: 0, h: 0, speed: 0, lane: undefined, track: undefined, ...ego },
    override: { lateral: !!overrideOn, longitudinal: false },
    driver: {
      throttle: 0,
      brake: 0,
      steer: 0,
      lateral_error: 0,
      heading_error: 0,
      speed_error: 0,
      lookahead: 0,
      valid: true,
    },
    indicator: { left: false, right: false },
    preview: { dt: 0, valid: false, points: [] },
  };
}

describe('buildEventMarkers', () => {
  it('emits no markers for a flat, stationary run', () => {
    const frames = [egoFrame({ sim_time: 0, speed: 0 }), egoFrame({ sim_time: 1, speed: 0 })];
    expect(buildEventMarkers(frames)).toEqual([]);
  });

  it('detects a start event once speed crosses the moving threshold (not at frame 0)', () => {
    const frames = [
      egoFrame({ sim_time: 0, speed: 0 }),
      egoFrame({ sim_time: 1, speed: 0.5 }),
      egoFrame({ sim_time: 2, speed: 1.2 }), // crosses > 0.8 here
    ];
    const events = buildEventMarkers(frames);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ idx: 2, kind: 'start' });
  });

  it('does not emit a start event when motion begins at frame 0 (fork behavior)', () => {
    const frames = [egoFrame({ sim_time: 0, speed: 5 }), egoFrame({ sim_time: 1, speed: 5 })];
    expect(buildEventMarkers(frames)).toEqual([]);
  });

  it('detects a stop event once speed drops below the stop threshold', () => {
    const frames = [
      egoFrame({ sim_time: 0, speed: 0 }),
      egoFrame({ sim_time: 1, speed: 2 }), // start (idx 1)
      egoFrame({ sim_time: 2, speed: 0.1 }), // stop (idx 2)
    ];
    const events = buildEventMarkers(frames);
    expect(events.map((e) => e.kind)).toEqual(['start', 'stop']);
  });

  it('detects a lane-change event when ego.lane changes between frames', () => {
    const frames = [
      egoFrame({ sim_time: 0, lane: -1 }),
      egoFrame({ sim_time: 1, lane: -1 }),
      egoFrame({ sim_time: 2, lane: -2 }),
    ];
    const events = buildEventMarkers(frames);
    expect(events).toHaveLength(1);
    // Markers carry kind + params, not display strings (i18n happens in the UI).
    expect(events[0]).toMatchObject({ idx: 2, kind: 'lane', laneFrom: -1, laneTo: -2 });
  });

  it('detects override on/off transitions', () => {
    const frames = [
      egoFrame({ sim_time: 0, overrideOn: false }),
      egoFrame({ sim_time: 1, overrideOn: true }),
      egoFrame({ sim_time: 2, overrideOn: false }),
    ];
    const events = buildEventMarkers(frames);
    expect(events.map((e) => e.kind)).toEqual(['override_on', 'override_off']);
  });
});
