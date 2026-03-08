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

  // Lane offset boundaries
  for (const lo of road.laneOffset) {
    if (lo.s > sStart && lo.s < sEnd) {
      criticalS.add(lo.s);
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
 * Generate curvature-adaptive sample points for a road segment.
 * Uses denser sampling on curved sections (arcs, spirals) and sparser on straights.
 * Targets ~2 degrees of arc per sample step for visually smooth polylines.
 */
export function generateCurvatureAdaptiveSamples(
  road: OdrRoad,
  sStart: number,
  sEnd: number,
  options?: Partial<SamplingOptions>,
): number[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Collect critical s values (boundaries where we must have a sample)
  const criticalS = new Set<number>();
  criticalS.add(sStart);
  criticalS.add(sEnd);

  for (const geom of road.planView) {
    if (geom.s > sStart && geom.s < sEnd) criticalS.add(geom.s);
  }
  for (const elev of road.elevationProfile) {
    if (elev.s > sStart && elev.s < sEnd) criticalS.add(elev.s);
  }
  for (const ls of road.lanes) {
    if (ls.s > sStart && ls.s < sEnd) criticalS.add(ls.s);
  }
  for (const lo of road.laneOffset) {
    if (lo.s > sStart && lo.s < sEnd) criticalS.add(lo.s);
  }

  const samples = new Set<number>(criticalS);

  // Walk through each geometry segment within [sStart, sEnd]
  for (const geom of road.planView) {
    const segStart = Math.max(sStart, geom.s);
    const segEnd = Math.min(sEnd, geom.s + geom.length);
    if (segStart >= segEnd) continue;

    // Determine step based on geometry curvature
    let step: number;
    if (geom.type === 'line') {
      step = opts.maxStep;
    } else if (geom.type === 'arc' && geom.curvature) {
      const radius = 1 / Math.abs(geom.curvature);
      // ~2 degrees per step: step = radius * 0.035 rad
      step = Math.max(opts.minStep, Math.min(opts.maxStep, radius * 0.035));
    } else if (geom.type === 'spiral') {
      const maxK = Math.max(Math.abs(geom.curvStart ?? 0), Math.abs(geom.curvEnd ?? 0));
      if (maxK > 1e-6) {
        const minRadius = 1 / maxK;
        step = Math.max(opts.minStep, Math.min(opts.maxStep, minRadius * 0.035));
      } else {
        step = opts.maxStep; // Nearly straight spiral
      }
    } else {
      // poly3, paramPoly3: use baseStep
      step = opts.baseStep;
    }

    let s = segStart + step;
    while (s < segEnd - 1e-6) {
      samples.add(s);
      s += step;
    }
  }

  return Array.from(samples).sort((a, b) => a - b);
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
