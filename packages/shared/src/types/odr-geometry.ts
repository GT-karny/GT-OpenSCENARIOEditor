/**
 * OpenDRIVE geometry and profile types.
 */

export interface OdrGeometry {
  s: number;
  x: number;
  y: number;
  hdg: number;
  length: number;
  type: 'line' | 'arc' | 'spiral' | 'poly3' | 'paramPoly3';
  /** Arc curvature */
  curvature?: number;
  /** Spiral start curvature */
  curvStart?: number;
  /** Spiral end curvature */
  curvEnd?: number;
  /** Poly3 coefficients */
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  /** ParamPoly3 U coefficients */
  aU?: number;
  bU?: number;
  cU?: number;
  dU?: number;
  /** ParamPoly3 V coefficients */
  aV?: number;
  bV?: number;
  cV?: number;
  dV?: number;
  /** ParamPoly3 parameter range */
  pRange?: 'arcLength' | 'normalized';
}

export interface OdrElevation {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrSuperelevation {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrLaneOffset {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface OdrShape {
  s: number;
  t: number;
  a: number;
  b: number;
  c: number;
  d: number;
}
