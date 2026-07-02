import { describe, it, expect } from 'vitest';
import {
  computeBatchMetrics,
  DEFAULT_COLLISION_THRESHOLD_M,
  type MetricFrame,
} from '../../../lib/wasm/batch-metrics';

/** Build a two-entity frame at `time` with entities at the given x positions. */
function frame(time: number, ax: number, bx: number, dims?: { length: number; width: number }): MetricFrame {
  return {
    time,
    objects: [
      { id: 0, x: ax, y: 0, ...dims },
      { id: 1, x: bx, y: 0, ...dims },
    ],
  };
}

describe('computeBatchMetrics', () => {
  describe('minDistance', () => {
    it('finds the smallest center-to-center distance across frames', () => {
      const frames: MetricFrame[] = [frame(0, 0, 50), frame(1, 0, 20), frame(2, 0, 30)];
      const m = computeBatchMetrics(frames);
      expect(m.minDistance).toBe(20);
    });

    it('returns Infinity when there is never a pair (single entity)', () => {
      const frames: MetricFrame[] = [{ time: 0, objects: [{ id: 0, x: 0, y: 0 }] }];
      const m = computeBatchMetrics(frames);
      expect(m.minDistance).toBe(Infinity);
      expect(m.collision).toBe(false);
    });

    it('returns Infinity for empty input', () => {
      const m = computeBatchMetrics([]);
      expect(m.minDistance).toBe(Infinity);
      expect(m.minTtc).toBe(Infinity);
      expect(m.collision).toBe(false);
    });
  });

  describe('collision detection', () => {
    it('flags a collision when centers close below the default threshold', () => {
      // 1.5 m apart < 2.0 m default → collision.
      const frames: MetricFrame[] = [frame(0, 0, 10), frame(1, 0, 1.5)];
      const m = computeBatchMetrics(frames);
      expect(m.collision).toBe(true);
      expect(m.collisionThreshold).toBe(DEFAULT_COLLISION_THRESHOLD_M);
    });

    it('does not flag a collision when entities stay apart', () => {
      const frames: MetricFrame[] = [frame(0, 0, 10), frame(1, 0, 5)];
      const m = computeBatchMetrics(frames);
      expect(m.collision).toBe(false);
    });

    it('derives the threshold from bounding dimensions when present', () => {
      // Two 4x2 vehicles: radius = hypot(4,2)/2 ≈ 2.236; pair threshold ≈ 4.472.
      const dims = { length: 4, width: 2 };
      const frames: MetricFrame[] = [frame(0, 0, 10, dims), frame(1, 0, 4, dims)];
      const m = computeBatchMetrics(frames);
      expect(m.collisionThreshold).toBeCloseTo(Math.hypot(4, 2), 5);
      // 4 m center gap < ~4.47 m threshold → collision.
      expect(m.collision).toBe(true);
    });
  });

  describe('minTtc', () => {
    it('computes TTC for an approaching pair', () => {
      // Gap shrinks 50 → 20 over 1 s → closing speed 30 m/s.
      // At frame 2 the distance is 20; gap to default threshold (2) is 18;
      // TTC = 18 / 30 = 0.6 s.
      const frames: MetricFrame[] = [frame(0, 0, 50), frame(1, 0, 20)];
      const m = computeBatchMetrics(frames);
      expect(m.minTtc).toBeCloseTo(18 / 30, 5);
    });

    it('returns Infinity when the pair never approaches (separating)', () => {
      const frames: MetricFrame[] = [frame(0, 0, 10), frame(1, 0, 30), frame(2, 0, 50)];
      const m = computeBatchMetrics(frames);
      expect(m.minTtc).toBe(Infinity);
    });

    it('returns Infinity when closing speed is below the noise threshold', () => {
      // Distance shrinks by only 0.05 m over 1 s → 0.05 m/s < 0.1 m/s.
      const frames: MetricFrame[] = [frame(0, 0, 10), frame(1, 0, 9.95)];
      const m = computeBatchMetrics(frames);
      expect(m.minTtc).toBe(Infinity);
    });

    it('yields TTC 0 once the pair is already within the collision threshold', () => {
      const frames: MetricFrame[] = [frame(0, 0, 5), frame(1, 0, 1.5)];
      const m = computeBatchMetrics(frames);
      expect(m.minTtc).toBe(0);
      expect(m.collision).toBe(true);
    });

    it('takes the minimum TTC across multiple approaching steps', () => {
      // Step 1: 50→30 (speed 20), dist 30, gap 28, ttc 1.4
      // Step 2: 30→10 (speed 20), dist 10, gap 8, ttc 0.4
      const frames: MetricFrame[] = [frame(0, 0, 50), frame(1, 0, 30), frame(2, 0, 10)];
      const m = computeBatchMetrics(frames);
      expect(m.minTtc).toBeCloseTo(8 / 20, 5);
    });
  });

  describe('pairing across frames', () => {
    it('pairs entities by id, not by array position', () => {
      // Same two entities but swapped array order between frames — must still
      // compute a valid closing speed via id lookup.
      const f0: MetricFrame = {
        time: 0,
        objects: [
          { id: 0, x: 0, y: 0 },
          { id: 1, x: 50, y: 0 },
        ],
      };
      const f1: MetricFrame = {
        time: 1,
        objects: [
          { id: 1, x: 20, y: 0 },
          { id: 0, x: 0, y: 0 },
        ],
      };
      const m = computeBatchMetrics([f0, f1]);
      expect(m.minDistance).toBe(20);
      expect(m.minTtc).toBeCloseTo(18 / 30, 5);
    });
  });
});
