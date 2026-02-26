/**
 * Euler spiral (clothoid) geometry evaluator.
 * Linearly varying curvature from curvStart to curvEnd.
 * Uses Simpson's rule for numerical integration.
 */
import type { OdrGeometry } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluateSpiral(ds: number, geom: OdrGeometry): Pose2D {
  const k0 = geom.curvStart ?? 0;
  const k1 = geom.curvEnd ?? 0;
  const L = geom.length;
  const dk = L > 1e-12 ? (k1 - k0) / L : 0;

  if (ds < 1e-12) {
    return { x: geom.x, y: geom.y, hdg: geom.hdg };
  }

  // Simpson's rule numerical integration
  // n must be even for composite Simpson's rule
  const rawN = Math.max(8, Math.ceil(ds / 0.5));
  const n = rawN % 2 === 1 ? rawN + 1 : rawN;
  const h = ds / n;

  let sumCos = 0;
  let sumSin = 0;

  for (let i = 0; i <= n; i++) {
    const t = i * h;
    const theta = k0 * t + 0.5 * dk * t * t;
    const w = i === 0 || i === n ? 1 : i % 2 === 1 ? 4 : 2;
    sumCos += w * Math.cos(theta);
    sumSin += w * Math.sin(theta);
  }

  const localU = (h / 3) * sumCos;
  const localV = (h / 3) * sumSin;

  const cosH0 = Math.cos(geom.hdg);
  const sinH0 = Math.sin(geom.hdg);

  return {
    x: geom.x + localU * cosH0 - localV * sinH0,
    y: geom.y + localU * sinH0 + localV * cosH0,
    hdg: geom.hdg + k0 * ds + 0.5 * dk * ds * ds,
  };
}
