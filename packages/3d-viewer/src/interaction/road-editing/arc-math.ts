/**
 * Shared math utilities for automatic arc/line computation during road creation.
 */

export interface AutoArcResult {
  curvature: number;
  arcLength: number;
  type: 'line' | 'arc';
  hdg: number;
}

/**
 * Compute geometry (line or arc) from a start point/heading to an endpoint.
 *
 * When `headingConstrained` is true, the start heading is fixed (e.g. snapped
 * or chained from a previous road) and the geometry curves to reach the endpoint.
 * When false, a straight line from start to end is used.
 */
export function computeAutoArc(
  startX: number,
  startY: number,
  startHdg: number,
  endX: number,
  endY: number,
  headingConstrained: boolean,
): AutoArcResult {
  const dx = endX - startX;
  const dy = endY - startY;
  const chord = Math.hypot(dx, dy);
  const lineHdg = Math.atan2(dy, dx);

  if (!headingConstrained || chord < 0.5) {
    return { curvature: 0, arcLength: chord, type: 'line', hdg: lineHdg };
  }

  // Angle difference between constrained heading and direct line to cursor
  let delta = lineHdg - startHdg;
  // Normalize to [-π, π]
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;

  if (Math.abs(delta) < 0.01) {
    // Nearly straight → line
    return { curvature: 0, arcLength: chord, type: 'line', hdg: startHdg };
  }

  // Curvature for a circular arc starting at startHdg and passing through endpoint
  const curvature = (2 * Math.sin(delta)) / chord;

  // Arc length: L = 2 * halfAngle / |curvature|
  const absCurv = Math.abs(curvature);
  const halfAngle = Math.asin(Math.min(absCurv * chord / 2, 1));
  const arcLength = Math.abs(2 * halfAngle / curvature);

  return { curvature, arcLength, type: 'arc', hdg: startHdg };
}

/**
 * Compute the endpoint position and heading of a geometry segment.
 */
export function computeGeometryEndpoint(
  x: number,
  y: number,
  hdg: number,
  length: number,
  curvature: number,
): { x: number; y: number; hdg: number } {
  if (Math.abs(curvature) > 1e-6) {
    const endHdg = hdg + curvature * length;
    const r = 1 / curvature;
    return {
      x: x + r * (Math.sin(endHdg) - Math.sin(hdg)),
      y: y + r * (-Math.cos(endHdg) + Math.cos(hdg)),
      hdg: endHdg,
    };
  }
  return {
    x: x + Math.cos(hdg) * length,
    y: y + Math.sin(hdg) * length,
    hdg,
  };
}
