/**
 * Parse OpenDRIVE geometry and profile elements.
 */
import type { OdrGeometry, OdrElevation, OdrSuperelevation, OdrLaneOffset } from '@osce/shared';
import { ensureArray, toNum } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parsePlanView(raw: Raw | undefined): OdrGeometry[] {
  if (!raw) return [];
  return ensureArray(raw.geometry).map(parseGeometry);
}

export function parseGeometry(raw: Raw): OdrGeometry {
  const base = {
    s: toNum(raw.s),
    x: toNum(raw.x),
    y: toNum(raw.y),
    hdg: toNum(raw.hdg),
    length: toNum(raw.length),
  };

  if ('line' in raw) {
    return { ...base, type: 'line' as const };
  }

  if ('arc' in raw) {
    const arc = typeof raw.arc === 'object' && raw.arc !== null ? raw.arc : {};
    return {
      ...base,
      type: 'arc' as const,
      curvature: toNum(arc.curvature),
    };
  }

  if ('spiral' in raw) {
    const sp = typeof raw.spiral === 'object' && raw.spiral !== null ? raw.spiral : {};
    return {
      ...base,
      type: 'spiral' as const,
      curvStart: toNum(sp.curvStart),
      curvEnd: toNum(sp.curvEnd),
    };
  }

  if ('poly3' in raw) {
    const p = typeof raw.poly3 === 'object' && raw.poly3 !== null ? raw.poly3 : {};
    return {
      ...base,
      type: 'poly3' as const,
      a: toNum(p.a),
      b: toNum(p.b),
      c: toNum(p.c),
      d: toNum(p.d),
    };
  }

  if ('paramPoly3' in raw) {
    const pp =
      typeof raw.paramPoly3 === 'object' && raw.paramPoly3 !== null ? raw.paramPoly3 : {};
    return {
      ...base,
      type: 'paramPoly3' as const,
      aU: toNum(pp.aU),
      bU: toNum(pp.bU),
      cU: toNum(pp.cU),
      dU: toNum(pp.dU),
      aV: toNum(pp.aV),
      bV: toNum(pp.bV),
      cV: toNum(pp.cV),
      dV: toNum(pp.dV),
      pRange: pp.pRange === 'normalized' ? ('normalized' as const) : ('arcLength' as const),
    };
  }

  // Fallback: treat unknown geometry as a line
  return { ...base, type: 'line' as const };
}

export function parseElevations(raw: Raw | undefined): OdrElevation[] {
  if (!raw) return [];
  return ensureArray(raw.elevation).map((e: Raw) => ({
    s: toNum(e.s),
    a: toNum(e.a),
    b: toNum(e.b),
    c: toNum(e.c),
    d: toNum(e.d),
  }));
}

export function parseSuperelevations(raw: Raw | undefined): OdrSuperelevation[] {
  if (!raw) return [];
  return ensureArray(raw.superelevation).map((e: Raw) => ({
    s: toNum(e.s),
    a: toNum(e.a),
    b: toNum(e.b),
    c: toNum(e.c),
    d: toNum(e.d),
  }));
}

export function parseLaneOffsets(raw: Raw | undefined): OdrLaneOffset[] {
  if (!raw) return [];
  return ensureArray(raw.laneOffset).map((e: Raw) => ({
    s: toNum(e.s),
    a: toNum(e.a),
    b: toNum(e.b),
    c: toNum(e.c),
    d: toNum(e.d),
  }));
}
