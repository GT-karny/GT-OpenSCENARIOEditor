import { describe, it, expect } from 'vitest';
import type { OdrRoad } from '@osce/shared';
import {
  detectRoadIntersections,
  detectIntersectionsIncremental,
} from '../../geometry/intersection-detection.js';

/**
 * Helper: create a minimal OdrRoad with a single line geometry segment.
 *
 * @param id    Road ID
 * @param x     Start x
 * @param y     Start y
 * @param hdg   Heading in radians
 * @param len   Length in meters
 * @param junction  Junction attribute ('-1' = normal road)
 */
function makeLineRoad(
  id: string,
  x: number,
  y: number,
  hdg: number,
  len: number,
  junction = '-1',
): OdrRoad {
  return {
    id,
    name: `Road_${id}`,
    length: len,
    junction,
    planView: [
      {
        s: 0,
        x,
        y,
        hdg,
        length: len,
        type: 'line',
      },
    ],
    elevationProfile: [],
    lateralProfile: [],
    laneOffset: [],
    lanes: [
      {
        s: 0,
        centerLane: { id: 0, type: 'none', width: [], roadMarks: [] },
        leftLanes: [],
        rightLanes: [
          {
            id: -1,
            type: 'driving',
            width: [{ sOffset: 0, a: 3.5, b: 0, c: 0, d: 0 }],
            roadMarks: [],
          },
        ],
      },
    ],
    objects: [],
    signals: [],
  };
}

describe('detectRoadIntersections', () => {
  it('should detect two perpendicular roads crossing at origin', () => {
    // Road A: horizontal, from (-50, 0) heading east, length 100
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    // Road B: vertical, from (0, -50) heading north, length 100
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    const results = detectRoadIntersections([roadA, roadB]);

    expect(results).toHaveLength(1);
    const r = results[0];
    // Band-based detection: point is approximate (within road width + sampling tolerance)
    expect(Math.abs(r.point.x)).toBeLessThan(10);
    expect(Math.abs(r.point.y)).toBeLessThan(10);
    // Intersection angle should be ~PI/2 (perpendicular)
    expect(r.angle).toBeCloseTo(Math.PI / 2, 0);
    // s-coordinates: both should be ~50 (midpoint of each 100m road)
    expect(r.sA).toBeCloseTo(50, -1);
    expect(r.sB).toBeCloseTo(50, -1);
  });

  it('should return no intersections for two parallel roads', () => {
    // Two horizontal roads separated by 20m in y
    const roadA = makeLineRoad('1', 0, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, 20, 0, 100);

    const results = detectRoadIntersections([roadA, roadB]);

    expect(results).toHaveLength(0);
  });

  it('should return no intersections for roads far apart', () => {
    // Road A near origin, Road B far away
    const roadA = makeLineRoad('1', 0, 0, 0, 50);
    const roadB = makeLineRoad('2', 500, 500, Math.PI / 4, 50);

    const results = detectRoadIntersections([roadA, roadB]);

    expect(results).toHaveLength(0);
  });

  it('should detect a T-junction where one road ends at another', () => {
    // Road A: horizontal, from (0, 0) heading east, length 100
    const roadA = makeLineRoad('1', 0, 0, 0, 100);
    // Road B: vertical, from (50, -30) heading north, length 30
    // This road ends exactly at road A's midpoint
    const roadB = makeLineRoad('2', 50, -30, Math.PI / 2, 30);

    const results = detectRoadIntersections([roadA, roadB], { sampleInterval: 1 });

    // Should detect at least one intersection (band/edge intersection)
    expect(results.length).toBeGreaterThanOrEqual(1);
    const r = results[0];
    // Intersection point should be near (50, 0) within road width tolerance
    expect(Math.abs(r.point.x - 50)).toBeLessThan(10);
    expect(Math.abs(r.point.y)).toBeLessThan(10);
  });

  it('should skip roads with junction != -1 (connecting roads)', () => {
    // Road A: normal road
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    // Road B: connecting road (junction = '5')
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100, '5');

    const results = detectRoadIntersections([roadA, roadB]);

    // Only one normal road => no pair to test => no intersections
    expect(results).toHaveLength(0);
  });

  it('should skip roads in excludeRoadIds', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    const results = detectRoadIntersections([roadA, roadB], {
      excludeRoadIds: new Set(['2']),
    });

    expect(results).toHaveLength(0);
  });

  it('should return empty for fewer than 2 candidate roads', () => {
    const roadA = makeLineRoad('1', 0, 0, 0, 100);
    const results = detectRoadIntersections([roadA]);
    expect(results).toHaveLength(0);
  });

  it('should return empty for empty road list', () => {
    const results = detectRoadIntersections([]);
    expect(results).toHaveLength(0);
  });

  it('should detect crossing at non-origin with correct angle', () => {
    // Road A: from (100, 100) heading 45 degrees (northeast), length 100
    const roadA = makeLineRoad('1', 100, 100, Math.PI / 4, 100);
    // Road B: from (100 + 50*cos(3PI/4), 100 + 50*sin(3PI/4)) heading 135 degrees (northwest)
    // These should cross at approximately (100 + 50*cos(PI/4), 100 + 50*sin(PI/4))
    const cx = 100 + 50 * Math.cos(Math.PI / 4);
    const cy = 100 + 50 * Math.sin(Math.PI / 4);
    const roadB = makeLineRoad(
      '2',
      cx - 50 * Math.cos((3 * Math.PI) / 4),
      cy - 50 * Math.sin((3 * Math.PI) / 4),
      (3 * Math.PI) / 4,
      100,
    );

    const results = detectRoadIntersections([roadA, roadB]);

    expect(results).toHaveLength(1);
    // Band-based detection: approximate position within road width tolerance
    expect(Math.abs(results[0].point.x - cx)).toBeLessThan(10);
    expect(Math.abs(results[0].point.y - cy)).toBeLessThan(10);
    // Angle between 45-deg and 135-deg roads = 90 degrees
    expect(results[0].angle).toBeCloseTo(Math.PI / 2, 0);
  });

  it('should produce at most one intersection per road pair', () => {
    // Two roads crossing: even with fine sampling, only one result per pair
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    const results = detectRoadIntersections([roadA, roadB], { sampleInterval: 1 });

    expect(results).toHaveLength(1);
  });
});

describe('detectIntersectionsIncremental', () => {
  it('should return empty when changedRoadIds is empty', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    const results = detectIntersectionsIncremental([roadA, roadB], new Set());

    expect(results).toHaveLength(0);
  });

  it('should detect intersection when changed road crosses another', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    const results = detectIntersectionsIncremental([roadA, roadB], new Set(['1']));

    expect(results).toHaveLength(1);
    // Band-based detection: point is approximate (within sampling + road width tolerance)
    expect(Math.abs(results[0].point.x)).toBeLessThan(10);
    expect(Math.abs(results[0].point.y)).toBeLessThan(10);
  });

  it('should not detect intersection with unchanged non-crossing roads', () => {
    // Three roads: A crosses B, C is far away and is the changed road
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);
    const roadC = makeLineRoad('3', 500, 500, 0, 50);

    // Only road C changed, which doesn't cross A or B
    const results = detectIntersectionsIncremental([roadA, roadB, roadC], new Set(['3']));

    expect(results).toHaveLength(0);
  });

  it('should detect intersections between two changed roads', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100);

    // Both roads changed
    const results = detectIntersectionsIncremental([roadA, roadB], new Set(['1', '2']));

    expect(results).toHaveLength(1);
    // Band-based detection: point is approximate (within sampling + road width tolerance)
    expect(Math.abs(results[0].point.x)).toBeLessThan(10);
    expect(Math.abs(results[0].point.y)).toBeLessThan(10);
  });

  it('should skip junction connecting roads in incremental mode', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100, '3'); // connecting road

    const results = detectIntersectionsIncremental([roadA, roadB], new Set(['1']));

    expect(results).toHaveLength(0);
  });

  it('should skip changed road if it is not a candidate (junction != -1)', () => {
    const roadA = makeLineRoad('1', -50, 0, 0, 100);
    const roadB = makeLineRoad('2', 0, -50, Math.PI / 2, 100, '5'); // connecting road

    const results = detectIntersectionsIncremental([roadA, roadB], new Set(['2']));

    expect(results).toHaveLength(0);
  });
});
