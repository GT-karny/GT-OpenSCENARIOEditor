import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { OdrRoad } from '@osce/shared';
import { XodrParser } from '../../parser/xodr-parser.js';
import { generateSamplePoints, generateCurvatureAdaptiveSamples } from '../../mesh/sampling.js';

/** A straight road whose superelevation changes at s=37 (not a step multiple). */
function bankedRoad(): OdrRoad {
  return {
    id: '1',
    name: '',
    length: 100,
    junction: '-1',
    planView: [{ s: 0, x: 0, y: 0, hdg: 0, length: 100, type: 'line' }],
    elevationProfile: [{ s: 0, a: 0, b: 0, c: 0, d: 0 }],
    lateralProfile: [
      { s: 0, a: 0, b: 0, c: 0, d: 0 },
      { s: 37, a: 0.02, b: 0, c: 0, d: 0 },
    ],
    laneOffset: [],
    lanes: [
      { s: 0, leftLanes: [], centerLane: { id: 0, type: 'none', width: [], roadMarks: [] }, rightLanes: [] },
    ],
    objects: [],
    signals: [],
  };
}

const CSS_FIXTURE = resolve(
  __dirname,
  '../../../../../test-fixtures/opendrive-v1.9/Ex_CrossSectionSurface_CrossFall_LeftTurn_1.xodr',
);

describe('sampling includes superelevation boundaries', () => {
  it('generateSamplePoints places a sample at the superelevation record start', () => {
    expect(generateSamplePoints(bankedRoad(), 0, 100)).toContain(37);
  });

  it('generateCurvatureAdaptiveSamples places a sample at the superelevation record start', () => {
    expect(generateCurvatureAdaptiveSamples(bankedRoad(), 0, 100)).toContain(37);
  });
});

describe('sampling includes cross-section-surface boundaries', () => {
  it('places samples at the strip width transitions (s=30, s=40)', () => {
    const road = new XodrParser().parse(readFileSync(CSS_FIXTURE, 'utf-8')).roads[0];
    const samples = generateSamplePoints(road, 0, road.length);
    expect(samples).toContain(30);
    expect(samples).toContain(40);
  });
});
