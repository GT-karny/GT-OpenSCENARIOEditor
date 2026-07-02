import { describe, it, expect } from 'vitest';
import type { Trajectory } from '@osce/shared';
import { computeTrajectoryVisualPoints } from '../../lib/trajectory-curve-computation';
import type { PointWorldPos } from '../../stores/trajectory-edit-store';

/**
 * Build a clothoidSpline Trajectory from raw segments. `positionStart` is set
 * on a segment only when its resolved anchor is non-ORIGIN, mirroring how the
 * preview stack aligns resolved positions with segments.
 */
function makeSpline(
  segments: Array<{
    curvatureStart: number;
    curvatureEnd: number;
    length: number;
    hOffset?: number;
    hasStart?: boolean;
  }>,
): Trajectory {
  return {
    name: 'test',
    closed: false,
    shape: {
      type: 'clothoidSpline',
      segments: segments.map((s) => ({
        curvatureStart: s.curvatureStart,
        curvatureEnd: s.curvatureEnd,
        length: s.length,
        hOffset: s.hOffset,
        // A dummy positionStart marker so the resolver treats the aligned world
        // position as an explicit anchor (only the first segment needs one).
        positionStart: s.hasStart
          ? { type: 'worldPosition', x: 0, y: 0, z: 0, h: 0 }
          : undefined,
      })),
    },
  };
}

/** Origin sentinel used by the preview stack for chained segments. */
const ORIGIN: PointWorldPos = { x: 0, y: 0, z: 0, h: 0 };

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('computeClothoidSplinePoints (via computeTrajectoryVisualPoints)', () => {
  it('returns empty for zero segments', () => {
    const traj = makeSpline([]);
    expect(computeTrajectoryVisualPoints(traj, [])).toEqual([]);
  });

  it('single straight segment (k0=k1=0) equals a line along the start heading', () => {
    // Start at (10, 5), heading 0, length 20, no curvature.
    const traj = makeSpline([{ curvatureStart: 0, curvatureEnd: 0, length: 20, hasStart: true }]);
    const start: PointWorldPos = { x: 10, y: 5, z: 2, h: 0 };
    const pts = computeTrajectoryVisualPoints(traj, [start]);

    expect(pts.length).toBeGreaterThan(2);
    // First point at the start.
    expect(pts[0].x).toBeCloseTo(10, 6);
    expect(pts[0].y).toBeCloseTo(5, 6);
    expect(pts[0].z).toBeCloseTo(2, 6);
    // Last point 20m along +x.
    const last = pts[pts.length - 1];
    expect(last.x).toBeCloseTo(30, 4);
    expect(last.y).toBeCloseTo(5, 6);
    // Every point stays on the straight line y=5.
    for (const p of pts) {
      expect(p.y).toBeCloseTo(5, 6);
    }
  });

  it('straight segment respects a non-zero start heading', () => {
    const traj = makeSpline([{ curvatureStart: 0, curvatureEnd: 0, length: 10, hasStart: true }]);
    const start: PointWorldPos = { x: 0, y: 0, z: 0, h: Math.PI / 2 };
    const pts = computeTrajectoryVisualPoints(traj, [start]);
    const last = pts[pts.length - 1];
    // Heading +Y: end should be at (0, 10).
    expect(last.x).toBeCloseTo(0, 4);
    expect(last.y).toBeCloseTo(10, 4);
  });

  it('constant curvature segment equals a circular arc', () => {
    const R = 25;
    const k = 1 / R;
    const L = (Math.PI / 2) * R; // quarter circle
    const traj = makeSpline([{ curvatureStart: k, curvatureEnd: k, length: L, hasStart: true }]);
    const start: PointWorldPos = { x: 0, y: 0, z: 0, h: 0 };
    const pts = computeTrajectoryVisualPoints(traj, [start]);

    // For a left turn starting at origin heading +x, the arc centre is (0, R).
    const centre = { x: 0, y: R };
    for (const p of pts) {
      expect(dist(p, centre)).toBeCloseTo(R, 2);
    }
    // Quarter circle end ~ (R, R).
    const last = pts[pts.length - 1];
    expect(last.x).toBeCloseTo(R, 1);
    expect(last.y).toBeCloseTo(R, 1);
  });

  it('multi-segment chain is C0- and heading-continuous at the junction', () => {
    // Segment 1: straight 10m from origin. Segment 2: constant-curvature arc,
    // chained (no explicit positionStart).
    const traj = makeSpline([
      { curvatureStart: 0, curvatureEnd: 0, length: 10, hasStart: true },
      { curvatureStart: 0.05, curvatureEnd: 0.05, length: 10, hasStart: false },
    ]);
    const start: PointWorldPos = { x: 0, y: 0, z: 0, h: 0 };
    // Aligned positions: seg0 has explicit start, seg1 chains (ORIGIN sentinel).
    const pts = computeTrajectoryVisualPoints(traj, [start, ORIGIN]);

    expect(pts.length).toBeGreaterThan(10);

    // End of first segment must land at (10, 0) (straight along +x).
    // Find the point closest to x=10 on the y=0 line before the arc bends away.
    // C0 continuity: no jump between consecutive points anywhere.
    let maxGap = 0;
    for (let i = 1; i < pts.length; i++) {
      maxGap = Math.max(maxGap, dist(pts[i], pts[i - 1]));
    }
    // Per-sample step is ~0.25m (10m / 40 samples); a discontinuity would be >>1m.
    expect(maxGap).toBeLessThan(0.6);

    // The junction point (end of straight segment) should be at ~(10, 0).
    // It is the first sample of segment 2 == last sample of segment 1.
    const junction = pts.find((p) => Math.abs(p.x - 10) < 0.3 && Math.abs(p.y) < 0.3);
    expect(junction).toBeDefined();

    // Curve should have bent left (positive curvature) past the junction:
    // final point y > 0.
    const last = pts[pts.length - 1];
    expect(last.y).toBeGreaterThan(0);
  });

  it('hOffset rotates the segment local frame', () => {
    // Straight segment with hOffset = +90deg on a start heading of 0 should go +Y.
    const traj = makeSpline([
      { curvatureStart: 0, curvatureEnd: 0, length: 10, hOffset: Math.PI / 2, hasStart: true },
    ]);
    const start: PointWorldPos = { x: 0, y: 0, z: 0, h: 0 };
    const pts = computeTrajectoryVisualPoints(traj, [start]);
    const last = pts[pts.length - 1];
    expect(last.x).toBeCloseTo(0, 4);
    expect(last.y).toBeCloseTo(10, 4);
  });

  it('first segment without a resolvable start yields no points', () => {
    const traj = makeSpline([{ curvatureStart: 0, curvatureEnd: 0, length: 10, hasStart: false }]);
    expect(computeTrajectoryVisualPoints(traj, [ORIGIN])).toEqual([]);
  });
});
