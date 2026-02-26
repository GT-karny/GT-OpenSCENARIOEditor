/**
 * Sampling strategy for road mesh generation.
 * Generates s-coordinate sample points along a road segment.
 */
import type { OdrRoad } from '@osce/shared';

export interface SamplingOptions {
  /** Base step size in meters (default: 2.0) */
  baseStep: number;
  /** Minimum step size in meters (default: 0.5) */
  minStep: number;
  /** Maximum step size in meters (default: 5.0) */
  maxStep: number;
}

const DEFAULT_OPTIONS: SamplingOptions = {
  baseStep: 2.0,
  minStep: 0.5,
  maxStep: 5.0,
};

/**
 * Generate sample s-coordinate points for a road segment.
 * Includes boundary points at geometry transitions and lane section boundaries.
 */
export function generateSamplePoints(
  road: OdrRoad,
  sStart: number,
  sEnd: number,
  options?: Partial<SamplingOptions>,
): number[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const step = opts.baseStep;

  // Collect critical s values (boundaries where we must have a sample)
  const criticalS = new Set<number>();
  criticalS.add(sStart);
  criticalS.add(sEnd);

  // Geometry segment boundaries
  for (const geom of road.planView) {
    if (geom.s > sStart && geom.s < sEnd) {
      criticalS.add(geom.s);
    }
  }

  // Elevation boundaries
  for (const elev of road.elevationProfile) {
    if (elev.s > sStart && elev.s < sEnd) {
      criticalS.add(elev.s);
    }
  }

  // Lane section boundaries
  for (const ls of road.lanes) {
    if (ls.s > sStart && ls.s < sEnd) {
      criticalS.add(ls.s);
    }
  }

  // Generate uniform samples
  const samples = new Set<number>(criticalS);
  let s = sStart + step;
  while (s < sEnd - 1e-6) {
    samples.add(s);
    s += step;
  }

  // Sort and return
  const sorted = Array.from(samples).sort((a, b) => a - b);
  return sorted;
}

/**
 * Simple uniform sampling without boundary awareness.
 */
export function generateUniformSamples(
  sStart: number,
  sEnd: number,
  step: number,
): number[] {
  const samples: number[] = [sStart];
  let s = sStart + step;
  while (s < sEnd - 1e-6) {
    samples.push(s);
    s += step;
  }
  if (samples[samples.length - 1] < sEnd - 1e-6) {
    samples.push(sEnd);
  }
  return samples;
}
