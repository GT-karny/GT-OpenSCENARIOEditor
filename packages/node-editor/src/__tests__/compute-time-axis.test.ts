import { describe, it, expect } from 'vitest';
import { computeTimeAxisConfig } from '../utils/compute-time-axis.js';

describe('computeTimeAxisConfig', () => {
  it('returns minimum 10s range for empty tracks', () => {
    const config = computeTimeAxisConfig([], 40);
    expect(config.maxTime).toBeGreaterThanOrEqual(10);
    expect(config.tickInterval).toBe(1);
    expect(config.ticks.length).toBeGreaterThan(0);
    expect(config.ticks[0].label).toBe('0s');
  });

  it('returns minimum 10s range for tracks with no events', () => {
    const config = computeTimeAxisConfig([{ events: [] }], 40);
    expect(config.maxTime).toBeGreaterThanOrEqual(10);
  });

  it('uses 1s interval for short scenarios (<=20s)', () => {
    const tracks = [{ events: [{ startTime: 5 }, { startTime: 15 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.tickInterval).toBe(1);
    expect(config.maxTime).toBeGreaterThanOrEqual(15);
  });

  it('uses 5s interval for medium scenarios (<=60s)', () => {
    const tracks = [{ events: [{ startTime: 30 }, { startTime: 45 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.tickInterval).toBe(5);
    expect(config.maxTime).toBeGreaterThanOrEqual(45);
  });

  it('uses 10s interval for long scenarios (>60s)', () => {
    const tracks = [{ events: [{ startTime: 80 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.tickInterval).toBe(10);
    expect(config.maxTime).toBeGreaterThanOrEqual(80);
  });

  it('ignores null start times', () => {
    const tracks = [{ events: [{ startTime: null }, { startTime: 5 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.maxTime).toBeGreaterThanOrEqual(5);
  });

  it('handles all-null start times as zero range', () => {
    const tracks = [{ events: [{ startTime: null }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.maxTime).toBeGreaterThanOrEqual(10);
  });

  it('calculates correct pixel positions', () => {
    const pps = 40;
    const tracks = [{ events: [{ startTime: 5 }] }];
    const config = computeTimeAxisConfig(tracks, pps);
    const tick5 = config.ticks.find((t) => t.time === 5);
    expect(tick5).toBeDefined();
    expect(tick5!.x).toBe(200); // 5 * 40
  });

  it('calculates totalWidth from maxTime * pixelsPerSecond', () => {
    const pps = 40;
    const config = computeTimeAxisConfig([], pps);
    expect(config.totalWidth).toBe(config.maxTime * pps);
  });

  it('includes padding beyond the max event time', () => {
    const tracks = [{ events: [{ startTime: 10 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.maxTime).toBeGreaterThan(10);
  });

  it('ensures right padding accommodates minimum event width (80px)', () => {
    // At 40pps, 80px = 2s — padding should be at least 2 tick intervals (not 1)
    const tracks = [{ events: [{ startTime: 10 }] }];
    const config = computeTimeAxisConfig(tracks, 40);
    // Event at 10s with 80px width extends to 10s + 80/40 = 12s
    // totalWidth must be >= 10 * 40 + 80 = 480
    expect(config.totalWidth).toBeGreaterThanOrEqual(10 * 40 + 80);
  });

  it('starts ticks at 0s', () => {
    const config = computeTimeAxisConfig([{ events: [{ startTime: 5 }] }], 40);
    expect(config.ticks[0].time).toBe(0);
    expect(config.ticks[0].x).toBe(0);
  });

  it('spans across multiple tracks', () => {
    const tracks = [
      { events: [{ startTime: 3 }] },
      { events: [{ startTime: 18 }] },
    ];
    const config = computeTimeAxisConfig(tracks, 40);
    expect(config.maxTime).toBeGreaterThanOrEqual(18);
  });
});
