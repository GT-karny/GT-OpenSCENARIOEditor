import { describe, it, expect } from 'vitest';
import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLane,
  OdrLaneSection,
  OdrLaneWidth,
  LaneChangeAction,
} from '@osce/shared';
import {
  computeLaneChangePath,
  computeLaneChangeLength,
  NOMINAL_SPEED_MPS,
  type WorldPose,
} from '../../lib/lane-change-path-computation';

const LANE_WIDTH = 3.5;

function makeLaneWidth(a: number): OdrLaneWidth {
  return { sOffset: 0, a, b: 0, c: 0, d: 0 };
}

function makeLane(id: number): OdrLane {
  return { id, type: id === 0 ? 'none' : 'driving', width: id === 0 ? [] : [makeLaneWidth(LANE_WIDTH)], roadMarks: [] };
}

/** Straight road along +x with 3 right lanes (-1, -2, -3) and one left lane (1). */
function makeRoad(): OdrRoad {
  const laneSection: OdrLaneSection = {
    s: 0,
    leftLanes: [makeLane(1)],
    centerLane: makeLane(0),
    rightLanes: [makeLane(-1), makeLane(-2), makeLane(-3)],
  };
  return {
    id: '0',
    name: 'TestRoad',
    length: 200,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 200, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [],
    laneOffset: [],
    lanes: [laneSection],
    objects: [],
    signals: [],
  };
}

function makeDoc(): OpenDriveDocument {
  return {
    header: { revMajor: 1, revMinor: 7, name: 'Test', date: '2024-01-01' },
    roads: [makeRoad()],
    controllers: [],
    junctions: [],
  };
}

/** Lane -N centre y = -(N - 0.5) * width (right lanes below reference line). */
function laneCentreY(laneId: number): number {
  return laneId * LANE_WIDTH + (laneId < 0 ? LANE_WIDTH / 2 : -LANE_WIDTH / 2);
}

function absoluteLaneChange(
  targetLaneId: number,
  dynamics: LaneChangeAction['dynamics'],
): LaneChangeAction {
  return { type: 'laneChangeAction', dynamics, target: { kind: 'absolute', value: targetLaneId } };
}

describe('computeLaneChangeLength', () => {
  it('distance dimension uses value directly', () => {
    const a = absoluteLaneChange(-1, { dynamicsShape: 'linear', dynamicsDimension: 'distance', value: 50 });
    expect(computeLaneChangeLength(a, 20)).toBeCloseTo(50, 6);
  });

  it('time dimension multiplies value by speed', () => {
    const a = absoluteLaneChange(-1, { dynamicsShape: 'linear', dynamicsDimension: 'time', value: 3 });
    expect(computeLaneChangeLength(a, 10)).toBeCloseTo(30, 6);
  });

  it('rate dimension derives length as speed / rate', () => {
    const a = absoluteLaneChange(-1, { dynamicsShape: 'linear', dynamicsDimension: 'rate', value: 0.5 });
    expect(computeLaneChangeLength(a, 10)).toBeCloseTo(20, 6);
  });

  it('step shape still gets a minimum visible length', () => {
    const a = absoluteLaneChange(-1, { dynamicsShape: 'step', dynamicsDimension: 'distance', value: 0 });
    expect(computeLaneChangeLength(a, 10)).toBeGreaterThan(0);
  });
});

describe('computeLaneChangePath (absolute target)', () => {
  it('samples a path from current lane centre to target lane centre', () => {
    const doc = makeDoc();
    // Entity starts in lane -2, at s=20.
    const pose: WorldPose = { x: 20, y: laneCentreY(-2), z: 0, h: 0 };
    const action = absoluteLaneChange(-1, {
      dynamicsShape: 'sinusoidal',
      dynamicsDimension: 'distance',
      value: 40,
    });
    const result = computeLaneChangePath(action, pose, doc, new Map(), 15);
    expect(result).not.toBeNull();
    expect(result!.fromLaneId).toBe(-2);
    expect(result!.toLaneId).toBe(-1);
    expect(result!.points.length).toBeGreaterThan(2);

    const first = result!.points[0];
    const last = result!.points[result!.points.length - 1];

    // Starts at the current lane centre.
    expect(first.y).toBeCloseTo(laneCentreY(-2), 1);
    // Ends at the target lane centre.
    expect(last.y).toBeCloseTo(laneCentreY(-1), 1);
    // Progresses forward along +x.
    expect(last.x).toBeGreaterThan(first.x);
  });

  it('sinusoidal shape is monotonic in lateral progress', () => {
    const doc = makeDoc();
    const pose: WorldPose = { x: 10, y: laneCentreY(-3), z: 0, h: 0 };
    const action = absoluteLaneChange(-1, {
      dynamicsShape: 'sinusoidal',
      dynamicsDimension: 'distance',
      value: 60,
    });
    const result = computeLaneChangePath(action, pose, doc, new Map(), 15);
    expect(result).not.toBeNull();

    // Lateral (y) should move monotonically from lane -3 up toward lane -1.
    const ys = result!.points.map((p) => p.y);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1] - 1e-6);
    }
    // Net lateral displacement equals 2 lane widths.
    expect(ys[ys.length - 1] - ys[0]).toBeCloseTo(2 * LANE_WIDTH, 0);
  });

  it('step shape jumps immediately to the target lane', () => {
    const doc = makeDoc();
    const pose: WorldPose = { x: 10, y: laneCentreY(-2), z: 0, h: 0 };
    const action = absoluteLaneChange(-1, {
      dynamicsShape: 'step',
      dynamicsDimension: 'distance',
      value: 20,
    });
    const result = computeLaneChangePath(action, pose, doc, new Map(), 15);
    expect(result).not.toBeNull();
    // After the first sample, everything is at the target lane centre.
    const tail = result!.points.slice(1);
    for (const p of tail) {
      expect(p.y).toBeCloseTo(laneCentreY(-1), 1);
    }
  });

  it('returns null when the entity is off any road', () => {
    const doc = makeDoc();
    const pose: WorldPose = { x: 20, y: 500, z: 0, h: 0 };
    const action = absoluteLaneChange(-1, {
      dynamicsShape: 'linear',
      dynamicsDimension: 'distance',
      value: 40,
    });
    expect(computeLaneChangePath(action, pose, doc, new Map(), 15)).toBeNull();
  });
});

describe('computeLaneChangePath (relative target)', () => {
  it('resolves the target lane from the reference entity lane + value', () => {
    const doc = makeDoc();
    // Actor in lane -3; reference entity (Ego) in lane -1; value 0 => target lane -1.
    const actorPose: WorldPose = { x: 25, y: laneCentreY(-3), z: 0, h: 0 };
    const egoPose: WorldPose = { x: 40, y: laneCentreY(-1), z: 0, h: 0 };
    const entityPositions = new Map<string, WorldPose>([['Ego', egoPose]]);

    const action: LaneChangeAction = {
      type: 'laneChangeAction',
      dynamics: { dynamicsShape: 'cubic', dynamicsDimension: 'time', value: 3 },
      target: { kind: 'relative', entityRef: 'Ego', value: 0 },
    };
    const result = computeLaneChangePath(action, actorPose, doc, entityPositions, 10);
    expect(result).not.toBeNull();
    expect(result!.fromLaneId).toBe(-3);
    expect(result!.toLaneId).toBe(-1);
    const last = result!.points[result!.points.length - 1];
    expect(last.y).toBeCloseTo(laneCentreY(-1), 1);
  });

  it('returns null when the reference entity has no known position', () => {
    const doc = makeDoc();
    const actorPose: WorldPose = { x: 25, y: laneCentreY(-3), z: 0, h: 0 };
    const action: LaneChangeAction = {
      type: 'laneChangeAction',
      dynamics: { dynamicsShape: 'cubic', dynamicsDimension: 'time', value: 3 },
      target: { kind: 'relative', entityRef: 'Ego', value: 0 },
    };
    expect(computeLaneChangePath(action, actorPose, doc, new Map(), 10)).toBeNull();
  });
});

describe('NOMINAL_SPEED_MPS default', () => {
  it('is used when no speed is supplied for a time-dimension change', () => {
    const doc = makeDoc();
    const pose: WorldPose = { x: 10, y: laneCentreY(-2), z: 0, h: 0 };
    const action = absoluteLaneChange(-1, {
      dynamicsShape: 'linear',
      dynamicsDimension: 'time',
      value: 2,
    });
    // length = value * NOMINAL_SPEED_MPS = 2 * 10 = 20; path should span ~20m in x.
    const result = computeLaneChangePath(action, pose, doc, new Map());
    expect(result).not.toBeNull();
    const first = result!.points[0];
    const last = result!.points[result!.points.length - 1];
    expect(last.x - first.x).toBeCloseTo(2 * NOMINAL_SPEED_MPS, 0);
  });
});
