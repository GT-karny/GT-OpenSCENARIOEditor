/**
 * OpenDRIVE geometry and profile types.
 */

/** Geometry type discriminant. */
export type OdrGeometryType = 'line' | 'arc' | 'spiral' | 'poly3' | 'paramPoly3';

/** Common reference-line placement shared by every geometry variant. */
export interface OdrGeometryBase {
  s: number;
  x: number;
  y: number;
  hdg: number;
  length: number;
}

/** Straight line segment. */
export interface OdrGeometryLine extends OdrGeometryBase {
  type: 'line';
}

/** Circular arc with constant curvature. */
export interface OdrGeometryArc extends OdrGeometryBase {
  type: 'arc';
  /** Arc curvature */
  curvature: number;
}

/** Euler spiral (clothoid) with linearly varying curvature. */
export interface OdrGeometrySpiral extends OdrGeometryBase {
  type: 'spiral';
  /** Spiral start curvature */
  curvStart: number;
  /** Spiral end curvature */
  curvEnd: number;
}

/** Cubic polynomial lateral offset. */
export interface OdrGeometryPoly3 extends OdrGeometryBase {
  type: 'poly3';
  /** Poly3 coefficients */
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Parametric cubic polynomial. */
export interface OdrGeometryParamPoly3 extends OdrGeometryBase {
  type: 'paramPoly3';
  /** ParamPoly3 U coefficients */
  aU: number;
  bU: number;
  cU: number;
  dU: number;
  /** ParamPoly3 V coefficients */
  aV: number;
  bV: number;
  cV: number;
  dV: number;
  /** ParamPoly3 parameter range */
  pRange: 'arcLength' | 'normalized';
}

/** Discriminated union of all OpenDRIVE plan-view geometry variants. */
export type OdrGeometry =
  | OdrGeometryLine
  | OdrGeometryArc
  | OdrGeometrySpiral
  | OdrGeometryPoly3
  | OdrGeometryParamPoly3;

/**
 * Flat partial of every geometry field, for editing/patch APIs that may carry
 * fields from any variant before a concrete variant is constructed (e.g. the
 * road editor's update commands). Construct a concrete {@link OdrGeometry}
 * variant from this before storing it in a document.
 */
export interface OdrGeometryUpdate {
  s?: number;
  x?: number;
  y?: number;
  hdg?: number;
  length?: number;
  type?: OdrGeometryType;
  curvature?: number;
  curvStart?: number;
  curvEnd?: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  aU?: number;
  bU?: number;
  cU?: number;
  dU?: number;
  aV?: number;
  bV?: number;
  cV?: number;
  dV?: number;
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
