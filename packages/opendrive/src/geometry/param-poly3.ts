/**
 * Parametric cubic polynomial (paramPoly3) geometry evaluator.
 * u(p) = aU + bU*p + cU*p^2 + dU*p^3
 * v(p) = aV + bV*p + cV*p^2 + dV*p^3
 * pRange: 'arcLength' → p = ds, 'normalized' → p = ds / length
 */
import type { OdrGeometry } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluateParamPoly3(ds: number, geom: OdrGeometry): Pose2D {
  const p = geom.pRange === 'normalized' && geom.length > 1e-12
    ? ds / geom.length
    : ds;

  const aU = geom.aU ?? 0;
  const bU = geom.bU ?? 0;
  const cU = geom.cU ?? 0;
  const dU = geom.dU ?? 0;
  const aV = geom.aV ?? 0;
  const bV = geom.bV ?? 0;
  const cV = geom.cV ?? 0;
  const dV = geom.dV ?? 0;

  const u = aU + p * (bU + p * (cU + p * dU));
  const v = aV + p * (bV + p * (cV + p * dV));

  // Derivatives for heading
  const du = bU + p * (2 * cU + p * 3 * dU);
  const dv = bV + p * (2 * cV + p * 3 * dV);
  const localHdg = Math.atan2(dv, du);

  const cosH0 = Math.cos(geom.hdg);
  const sinH0 = Math.sin(geom.hdg);

  return {
    x: geom.x + u * cosH0 - v * sinH0,
    y: geom.y + u * sinH0 + v * cosH0,
    hdg: geom.hdg + localHdg,
  };
}
