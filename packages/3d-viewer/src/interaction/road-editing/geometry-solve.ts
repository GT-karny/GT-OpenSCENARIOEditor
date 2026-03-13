/**
 * Geometry solve utilities for interactive road editing.
 * Compute hdg/length/curvature from start↔end point constraints.
 */

import type { OdrGeometry } from '@osce/shared';

const MAX_CURVATURE = 1.0;

/** Compute the endpoint of a geometry segment */
export function computeEndpoint(geo: OdrGeometry): [number, number] {
  if (geo.type === 'arc' && geo.curvature !== undefined && Math.abs(geo.curvature) > 1e-10) {
    const k = geo.curvature;
    const endHdg = geo.hdg + k * geo.length;
    const r = 1 / k;
    const dx = r * (Math.sin(endHdg) - Math.sin(geo.hdg));
    const dy = r * (-Math.cos(endHdg) + Math.cos(geo.hdg));
    return [geo.x + dx, geo.y + dy];
  }
  // Line or near-zero curvature arc
  return [geo.x + Math.cos(geo.hdg) * geo.length, geo.y + Math.sin(geo.hdg) * geo.length];
}

/**
 * Solve geometry params when the END point is dragged (start position + heading fixed).
 *
 * Line: recompute hdg + length from start → new end.
 * Arc: keep start hdg, solve curvature from chord deflection angle.
 */
export function solveFromEndpoint(
  geo: OdrGeometry,
  endX: number,
  endY: number,
): { hdg?: number; length: number; curvature?: number } {
  const dx = endX - geo.x;
  const dy = endY - geo.y;
  const chord = Math.sqrt(dx * dx + dy * dy);

  if (chord < 0.01) return { length: 0.01 };

  if (geo.type === 'line') {
    return { hdg: Math.atan2(dy, dx), length: chord };
  }

  if (geo.type === 'arc') {
    const chordAngle = Math.atan2(dy, dx);
    let beta = chordAngle - geo.hdg;
    while (beta > Math.PI) beta -= 2 * Math.PI;
    while (beta < -Math.PI) beta += 2 * Math.PI;

    if (Math.abs(beta) < 1e-6) {
      return { curvature: 0, length: chord };
    }

    const curvature = (2 * Math.sin(beta)) / chord;
    const arcLength = (beta * chord) / Math.sin(beta);
    const clampedCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, curvature));

    return { curvature: clampedCurvature, length: Math.abs(arcLength) };
  }

  return { length: chord };
}

/**
 * Solve geometry params when the START point is dragged (end position fixed).
 *
 * Line: recompute hdg + length from new start → existing end.
 * Arc: preserve end heading, solve start heading + curvature from chord geometry.
 */
export function solveFromStartpoint(
  geo: OdrGeometry,
  newX: number,
  newY: number,
): { x: number; y: number; hdg: number; length: number; curvature?: number } {
  const [endX, endY] = computeEndpoint(geo);
  const dx = endX - newX;
  const dy = endY - newY;
  const chord = Math.sqrt(dx * dx + dy * dy);

  if (chord < 0.01) {
    return { x: newX, y: newY, hdg: geo.hdg, length: 0.01 };
  }

  if (geo.type === 'line') {
    const hdg = Math.atan2(dy, dx);
    return { x: newX, y: newY, hdg, length: chord };
  }

  if (geo.type === 'arc') {
    // Preserve end heading: endHdg = geo.hdg + k * geo.length
    const endHdg = geo.hdg + (geo.curvature ?? 0) * geo.length;
    const chordAngle = Math.atan2(dy, dx);

    // For circular arc: chordAngle = (startHdg + endHdg) / 2
    // So: startHdg = 2 * chordAngle - endHdg
    const startHdg = 2 * chordAngle - endHdg;

    // beta = endHdg - chordAngle (half of total turn angle from end perspective)
    let beta = endHdg - chordAngle;
    while (beta > Math.PI) beta -= 2 * Math.PI;
    while (beta < -Math.PI) beta += 2 * Math.PI;

    if (Math.abs(beta) < 1e-6) {
      return { x: newX, y: newY, hdg: chordAngle, length: chord, curvature: 0 };
    }

    const curvature = (2 * Math.sin(beta)) / chord;
    const arcLength = (beta * chord) / Math.sin(beta);
    const clampedCurvature = Math.max(-MAX_CURVATURE, Math.min(MAX_CURVATURE, curvature));

    return {
      x: newX,
      y: newY,
      hdg: startHdg,
      length: Math.abs(arcLength),
      curvature: clampedCurvature,
    };
  }

  // Fallback
  const hdg = Math.atan2(dy, dx);
  return { x: newX, y: newY, hdg, length: chord };
}
