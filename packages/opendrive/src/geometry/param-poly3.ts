/**
 * Parametric cubic polynomial (paramPoly3) geometry evaluator.
 * u(p) = aU + bU*p + cU*p^2 + dU*p^3
 * v(p) = aV + bV*p + cV*p^2 + dV*p^3
 * pRange: 'arcLength' → p = ds, 'normalized' → p = ds / length
 */
import type { OdrGeometryParamPoly3 } from '@osce/shared';
import type { Pose2D } from './types.js';

export function evaluateParamPoly3(ds: number, geom: OdrGeometryParamPoly3): Pose2D {
  const p = geom.pRange === 'normalized' && geom.length > 1e-12
    ? ds / geom.length
    : ds;

  const aU = geom.aU;
  const bU = geom.bU;
  const cU = geom.cU;
  const dU = geom.dU;
  const aV = geom.aV;
  const bV = geom.bV;
  const cV = geom.cV;
  const dV = geom.dV;

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
