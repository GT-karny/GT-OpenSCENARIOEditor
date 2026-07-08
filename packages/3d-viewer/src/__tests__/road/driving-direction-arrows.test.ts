import { describe, it, expect } from 'vitest';
import {
  computeArrowSampleS,
  computeRoadArrowPlacements,
  DEFAULT_ARROW_SPACING,
} from '../../road/driving-direction-arrows.js';
import { makeStraightRoad } from '../helpers.js';

/** Normalize an angle to (-π, π] for stable comparison. */
function norm(a: number): number {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

describe('computeArrowSampleS', () => {
  it('samples at half-spacing offsets across the road length', () => {
    const s = computeArrowSampleS(100, 20);
    expect(s).toEqual([10, 30, 50, 70, 90]);
  });

  it('returns a single mid-road sample for very short roads', () => {
    const s = computeArrowSampleS(5, 20);
    expect(s).toEqual([2.5]);
  });

  it('returns nothing for non-positive length', () => {
    expect(computeArrowSampleS(0)).toEqual([]);
    expect(computeArrowSampleS(-10)).toEqual([]);
  });

  it('defaults to DEFAULT_ARROW_SPACING', () => {
    const s = computeArrowSampleS(100);
    expect(s.length).toBe(Math.ceil((100 - DEFAULT_ARROW_SPACING / 2) / DEFAULT_ARROW_SPACING));
  });
});

describe('computeRoadArrowPlacements', () => {
  it('produces one arrow per driving lane per sample', () => {
    const road = makeStraightRoad(); // 100m, lanes +1 and -1, both driving
    const placements = computeRoadArrowPlacements(road, 20);
    // 5 samples * 2 driving lanes
    expect(placements.length).toBe(10);
  });

  it('places right-lane (id=-1) arrows on the negative-t side', () => {
    const road = makeStraightRoad();
    const placements = computeRoadArrowPlacements(road, 20);
    const right = placements.filter((p) => p.laneId === -1);
    expect(right.length).toBeGreaterThan(0);
    // Right lane of a straight +x road sits at negative y.
    for (const p of right) expect(p.y).toBeLessThan(0);
  });

  it('RHT: right lanes travel with +s (heading 0), left lanes against (π)', () => {
    const road = makeStraightRoad(); // rule undefined => RHT default
    const placements = computeRoadArrowPlacements(road, 20);
    const right = placements.find((p) => p.laneId === -1)!;
    const left = placements.find((p) => p.laneId === 1)!;
    expect(norm(right.heading)).toBeCloseTo(0, 5);
    expect(Math.abs(norm(left.heading))).toBeCloseTo(Math.PI, 5);
  });

  it('LHT: flips travel direction relative to RHT', () => {
    const rhtRoad = makeStraightRoad();
    const lhtRoad = makeStraightRoad();
    lhtRoad.rule = 'LHT';

    const rht = computeRoadArrowPlacements(rhtRoad, 20);
    const lht = computeRoadArrowPlacements(lhtRoad, 20);

    const rhtRight = rht.find((p) => p.laneId === -1)!;
    const lhtRight = lht.find((p) => p.laneId === -1)!;
    // Same lane, opposite travel headings between RHT and LHT.
    const delta = Math.abs(norm(lhtRight.heading - rhtRight.heading));
    expect(delta).toBeCloseTo(Math.PI, 5);
  });

  it('applies the surface z-offset is handled by the component, not the placement', () => {
    const road = makeStraightRoad();
    const placements = computeRoadArrowPlacements(road, 20);
    // Placement z is the raw lane elevation (0 here); z-offset is added in the mesh.
    for (const p of placements) expect(p.z).toBeCloseTo(0, 5);
  });

  it('places arrows on the banked surface under superelevation', () => {
    const road = makeStraightRoad(); // lanes ±1, each 3.5m → centers at t=±1.75
    const roll = 0.1;
    road.elevationProfile = [{ s: 0, a: 1, b: 0, c: 0, d: 0 }];
    road.lateralProfile = [{ s: 0, a: roll, b: 0, c: 0, d: 0 }];
    const placements = computeRoadArrowPlacements(road, 20);
    const right = placements.find((p) => p.laneId === -1)!; // t = -1.75
    const left = placements.find((p) => p.laneId === 1)!; // t = +1.75
    // z = elevation + t·sin(roll) — arrows ride the bank instead of the flat plane.
    expect(right.z).toBeCloseTo(1 + -1.75 * Math.sin(roll), 5);
    expect(left.z).toBeCloseTo(1 + 1.75 * Math.sin(roll), 5);
    expect(left.z).toBeGreaterThan(right.z);
  });

  it('skips non-driving lanes', () => {
    const road = makeStraightRoad();
    // Turn the left lane into a sidewalk; only the right driving lane remains.
    road.lanes[0].leftLanes[0].type = 'sidewalk';
    const placements = computeRoadArrowPlacements(road, 20);
    expect(placements.every((p) => p.laneId === -1)).toBe(true);
    expect(placements.length).toBe(5);
  });
});
