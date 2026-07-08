/**
 * Parse OpenDRIVE geometry and profile elements.
 */
import type {
  OdrGeometry,
  OdrGeometryBase,
  OdrElevation,
  OdrSuperelevation,
  OdrLaneOffset,
  OdrShape,
} from '@osce/shared';
import { ensureArray, attr, attrNum, ATTR_PREFIX } from './xml-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function parsePlanView(raw: Raw | undefined): OdrGeometry[] {
  if (!raw) return [];
  return ensureArray(raw.geometry).map(parseGeometry);
}

export function parseGeometry(raw: Raw): OdrGeometry {
  const base: OdrGeometryBase = {
    s: attrNum(raw, 's'),
    x: attrNum(raw, 'x'),
    y: attrNum(raw, 'y'),
    hdg: attrNum(raw, 'hdg'),
    length: attrNum(raw, 'length'),
  };

  if ('line' in raw) {
    return { ...base, type: 'line' as const };
  }

  if ('arc' in raw) {
    const arc = typeof raw.arc === 'object' && raw.arc !== null ? raw.arc : {};
    return {
      ...base,
      type: 'arc' as const,
      curvature: attrNum(arc, 'curvature'),
    };
  }

  if ('spiral' in raw) {
    const sp = typeof raw.spiral === 'object' && raw.spiral !== null ? raw.spiral : {};
    return {
      ...base,
      type: 'spiral' as const,
      curvStart: attrNum(sp, 'curvStart'),
      curvEnd: attrNum(sp, 'curvEnd'),
    };
  }

  if ('poly3' in raw) {
    const p = typeof raw.poly3 === 'object' && raw.poly3 !== null ? raw.poly3 : {};
    return {
      ...base,
      type: 'poly3' as const,
      a: attrNum(p, 'a'),
      b: attrNum(p, 'b'),
      c: attrNum(p, 'c'),
      d: attrNum(p, 'd'),
    };
  }

  if ('paramPoly3' in raw) {
    const pp =
      typeof raw.paramPoly3 === 'object' && raw.paramPoly3 !== null ? raw.paramPoly3 : {};
    return {
      ...base,
      type: 'paramPoly3' as const,
      aU: attrNum(pp, 'aU'),
      bU: attrNum(pp, 'bU'),
      cU: attrNum(pp, 'cU'),
      dU: attrNum(pp, 'dU'),
      aV: attrNum(pp, 'aV'),
      bV: attrNum(pp, 'bV'),
      cV: attrNum(pp, 'cV'),
      dV: attrNum(pp, 'dV'),
      pRange: attr(pp, 'pRange') === 'normalized' ? ('normalized' as const) : ('arcLength' as const),
    };
  }

  // No known primitive present. Do NOT fabricate a <line> — that would
  // silently corrupt the road shape. Fail loudly, naming the primitive so
  // the caller can see which unsupported geometry was encountered.
  const primitives = Object.keys(raw).filter((k) => !k.startsWith(ATTR_PREFIX));
  const found = primitives.length > 0 ? primitives.join(', ') : '<none>';
  throw new Error(
    `Unsupported OpenDRIVE geometry primitive at s=${base.s}: expected one of ` +
      `line/arc/spiral/poly3/paramPoly3 but found ${found}`,
  );
}

export function parseElevations(raw: Raw | undefined): OdrElevation[] {
  if (!raw) return [];
  return ensureArray(raw.elevation).map((e: Raw) => ({
    s: attrNum(e, 's'),
    a: attrNum(e, 'a'),
    b: attrNum(e, 'b'),
    c: attrNum(e, 'c'),
    d: attrNum(e, 'd'),
  }));
}

export function parseSuperelevations(raw: Raw | undefined): OdrSuperelevation[] {
  if (!raw) return [];
  return ensureArray(raw.superelevation).map((e: Raw) => ({
    s: attrNum(e, 's'),
    a: attrNum(e, 'a'),
    b: attrNum(e, 'b'),
    c: attrNum(e, 'c'),
    d: attrNum(e, 'd'),
  }));
}

export function parseLaneOffsets(raw: Raw | undefined): OdrLaneOffset[] {
  if (!raw) return [];
  return ensureArray(raw.laneOffset).map((e: Raw) => ({
    s: attrNum(e, 's'),
    a: attrNum(e, 'a'),
    b: attrNum(e, 'b'),
    c: attrNum(e, 'c'),
    d: attrNum(e, 'd'),
  }));
}

export function parseShapes(raw: Raw | undefined): OdrShape[] {
  if (!raw) return [];
  return ensureArray(raw.shape).map((s: Raw) => ({
    s: attrNum(s, 's'),
    t: attrNum(s, 't'),
    a: attrNum(s, 'a'),
    b: attrNum(s, 'b'),
    c: attrNum(s, 'c'),
    d: attrNum(s, 'd'),
  }));
}
