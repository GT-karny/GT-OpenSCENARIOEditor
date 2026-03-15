import { describe, it, expect } from 'vitest';
import type { OdrRoad } from '@osce/shared';
import { computeRoadWidthAtS, computeSplitDistance } from '../../operations/junction-operations.js';
import { createTestRoad } from '../helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a road with a specific number of driving lanes (symmetric: left + right). */
function makeRoadWithLanes(
  laneCount: number,
  laneWidth = 3.5,
  roadLength = 100,
): OdrRoad {
  const widthRecord = [{ sOffset: 0, a: laneWidth, b: 0, c: 0, d: 0 }];
  const rightLanes = Array.from({ length: Math.ceil(laneCount / 2) }, (_, i) => ({
    id: -(i + 1),
    type: 'driving' as const,
    width: widthRecord,
    roadMarks: [],
  }));
  const leftLanes = Array.from({ length: Math.floor(laneCount / 2) }, (_, i) => ({
    id: i + 1,
    type: 'driving' as const,
    width: widthRecord,
    roadMarks: [],
  }));

  return createTestRoad({
    length: roadLength,
    lanes: [
      {
        s: 0,
        leftLanes,
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes,
      },
    ],
  });
}

/** Create a road with varying lane width (polynomial). */
function makeRoadWithVaryingWidth(): OdrRoad {
  return createTestRoad({
    length: 100,
    lanes: [
      {
        s: 0,
        leftLanes: [],
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.0, b: 0.02, c: 0, d: 0 }], // widens linearly
            roadMarks: [],
          },
          {
            id: -2,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], // constant
            roadMarks: [],
          },
        ],
      },
    ],
  });
}

const deg = (d: number) => (d * Math.PI) / 180;

// ---------------------------------------------------------------------------
// Tests: computeRoadWidthAtS
// ---------------------------------------------------------------------------

describe('computeRoadWidthAtS', () => {
  it('computes width for a single-lane road (constant width)', () => {
    const road = makeRoadWithLanes(1, 3.5);
    expect(computeRoadWidthAtS(road, 0)).toBeCloseTo(3.5);
    expect(computeRoadWidthAtS(road, 50)).toBeCloseTo(3.5);
  });

  it('computes width for a 2-lane road (1 left + 1 right)', () => {
    const road = makeRoadWithLanes(2, 3.5);
    expect(computeRoadWidthAtS(road, 0)).toBeCloseTo(7.0);
  });

  it('computes width for a 4-lane road', () => {
    const road = makeRoadWithLanes(4, 3.5);
    expect(computeRoadWidthAtS(road, 0)).toBeCloseTo(14.0);
  });

  it('evaluates polynomial lane widths at different s positions', () => {
    const road = makeRoadWithVaryingWidth();
    // At s=0: lane -1 = 3.0, lane -2 = 3.5, total = 6.5
    expect(computeRoadWidthAtS(road, 0)).toBeCloseTo(6.5);
    // At s=50: lane -1 = 3.0 + 0.02*50 = 4.0, lane -2 = 3.5, total = 7.5
    expect(computeRoadWidthAtS(road, 50)).toBeCloseTo(7.5);
  });

  it('uses multiple lane sections', () => {
    const road = createTestRoad({
      length: 100,
      lanes: [
        {
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [
            { id: -1, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
        },
        {
          s: 50,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [
            { id: -1, type: 'driving', width: [{ sOffset: 0, a: 4.0, b: 0, c: 0, d: 0 }], roadMarks: [] },
            { id: -2, type: 'driving', width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }], roadMarks: [] },
          ],
        },
      ],
    });
    // At s=25 (first section): 3.5
    expect(computeRoadWidthAtS(road, 25)).toBeCloseTo(3.5);
    // At s=75 (second section): 4.0 + 3.5 = 7.5
    expect(computeRoadWidthAtS(road, 75)).toBeCloseTo(7.5);
  });

  it('returns minimum 3.5m for a road with no lanes', () => {
    const road = createTestRoad({
      lanes: [
        {
          s: 0,
          leftLanes: [],
          centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
          rightLanes: [],
        },
      ],
    });
    expect(computeRoadWidthAtS(road, 0)).toBe(3.5);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeSplitDistance
// ---------------------------------------------------------------------------

describe('computeSplitDistance', () => {
  // computeSplitDistance(ownRoadWidth, otherRoadWidth, angle)
  //
  // Three physical constraints:
  //   1. Minimum turning radius R_min = 5m
  //   2. Edge clearance: totalHalfWidth / sin(θ)
  //   3. Arm length cap: max(ownWidth, otherWidth) × 2.5

  describe('constraint 1: minimum turning radius (R_min = 5m)', () => {
    it('returns R_min for narrow roads at perpendicular', () => {
      // 90° + single-lane: edgeClearance = 3.5 / sin(90°) = 3.5 < R_min = 5
      expect(computeSplitDistance(3.5, 3.5, deg(90))).toBe(5);
    });
  });

  describe('constraint 2: edge clearance (totalHalfWidth / sin(θ))', () => {
    it('returns 7m for 90° with two 2-lane roads (W=7m)', () => {
      // edgeClearance = (7+7)/2 / sin(90°) = 7 / 1 = 7m > R_min
      expect(computeSplitDistance(7, 7, deg(90))).toBeCloseTo(7);
    });

    it('returns ~10m for 45° with two 2-lane roads', () => {
      // edgeClearance = 7 / sin(45°) = 7 / 0.707 ≈ 9.9m
      expect(computeSplitDistance(7, 7, deg(45))).toBeCloseTo(9.9, 0);
    });

    it('returns 14m for 30° with two 2-lane roads', () => {
      // edgeClearance = 7 / sin(30°) = 7 / 0.5 = 14m
      expect(computeSplitDistance(7, 7, deg(30))).toBeCloseTo(14);
    });

    it('returns 14m for 90° with two 4-lane roads (W=14m)', () => {
      // edgeClearance = (14+14)/2 / sin(90°) = 14m
      expect(computeSplitDistance(14, 14, deg(90))).toBeCloseTo(14);
    });

    it('returns 28m for 30° with two 4-lane roads', () => {
      // edgeClearance = 14 / sin(30°) = 28m < armCap = 35m
      expect(computeSplitDistance(14, 14, deg(30))).toBeCloseTo(28);
    });
  });

  describe('constraint 3: arm length cap (maxWidth × 2.5)', () => {
    it('caps 2-lane roads at 15° (edge clearance exceeds arm cap)', () => {
      // edgeClearance = 7 / sin(15°) = 7 / 0.259 ≈ 27m
      // armCap = 7 * 2.5 = 17.5m → caps
      expect(computeSplitDistance(7, 7, deg(15))).toBeCloseTo(17.5);
    });

    it('caps 4-lane roads at 15°', () => {
      // edgeClearance = 14 / sin(15°) ≈ 54m
      // armCap = 14 * 2.5 = 35m → caps
      expect(computeSplitDistance(14, 14, deg(15))).toBeCloseTo(35);
    });

    it('caps at very acute angles', () => {
      // 10°: edgeClearance = 7 / sin(10°) ≈ 40m → armCap = 17.5m
      expect(computeSplitDistance(7, 7, deg(10))).toBeCloseTo(17.5);
    });
  });

  describe('asymmetric road widths', () => {
    it('uses total half-width for clearance and wider road for cap', () => {
      // 7m meets 14m at 30°: edgeClearance = (7+14)/2 / sin(30°) = 10.5/0.5 = 21m
      // armCap = max(7,14) * 2.5 = 35m → not capped
      expect(computeSplitDistance(7, 14, deg(30))).toBeCloseTo(21);
      expect(computeSplitDistance(14, 7, deg(30))).toBeCloseTo(21);
    });
  });
});
