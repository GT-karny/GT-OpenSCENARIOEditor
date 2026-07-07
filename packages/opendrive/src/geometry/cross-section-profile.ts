/**
 * Authored `<crossSectionSurface>` height-field evaluator (OpenDRIVE 1.9).
 *
 * A cross section surface replaces superelevation/shape (mutually exclusive per
 * XSD) and defines the road surface height as a lateral profile built from up to
 * four `<strip>` polynomials. P2 typed the surface down to strip level; the
 * polynomial leaves (`<width>`/`<constant>`/`<linear>`/`<quadratic>`/`<cubic>` →
 * `<coefficients>`) and the top-level `<tOffset>` ride verbatim in each node's
 * `extra`. This module parses those leaves once and returns a closure that maps
 * road coordinates (s, t) to a surface height, so the mesh can bank the surface.
 *
 * Evaluation model (documented approximation — the ASAM t-direction closed form
 * is not fully pinned down by the XSD, and authored fixtures omit strip widths on
 * every strip except the inner one, so a per-strip normalized ramp is not
 * generally computable):
 *
 * - s-direction: exact piecewise cubic. Each `<coefficients>` row starts at its
 *   `@s` (the first at s=0, like elevation records); value = a + b·ds + c·ds² +
 *   d·ds³ with ds measured from the active row's `@s`.
 * - t-direction: within a strip, height = Σ variant(s)·u^k where u = |t| −
 *   innerEdge (metres outward from the strip's inner edge) and k = 0/1/2/3 for
 *   constant/linear/quadratic/cubic. A `<linear>` coefficient is thus a lateral
 *   slope (per metre), which matches how the authored crossfall/camber fixtures
 *   express the tilt and needs no strip width to evaluate.
 * - strip layout: strips are ordered by |id| (±1 inner, ±2 outer); the sign of id
 *   selects the side (t≥0 uses positive ids, t<0 the negative ids). The inner
 *   strip starts at t=0; each strip's outer edge = inner edge + its `<width>`
 *   (evaluated in s). Only the inner strip carries a `<width>` per XSD; a strip
 *   without one extends across the rest of the road (see FALLBACK_STRIP_WIDTH).
 * - `mode='relative'` outer strips add onto the running height at the previous
 *   strip's outer edge; `mode='independent'` (default) start from zero.
 * - `<tOffset>` is applied as a uniform height offset of the whole profile.
 *   (ASAM defines tOffset as a lateral shift of the strips; treating it as a
 *   vertical base is the documented approximation used here and is what places
 *   the surface at its authored height — e.g. −0.375 m for the CrossFall fixture.)
 * - beyond the outermost strip, the surface stays flat at that edge's height.
 */
import type { OdrRoad, OdrCrossSectionStrip, OdrExtra, OdrExtraChild, OdrStripMode } from '@osce/shared';
import { evalCubic, findRecordAtS, ensureArray } from '../utils/math.js';
import { ATTR_PREFIX } from '../parser/xml-helpers.js';

/** Width used for a strip that has no `<width>` leaf. Generous enough to span
 *  any real road half-width, so the surface follows the strip slope across the
 *  whole road and only goes flat far beyond it (robustness — the mesh never
 *  samples t past the road edge). */
const FALLBACK_STRIP_WIDTH = 1e3;

/** One `<coefficients>` row: a cubic in s starting at `s`. */
interface SPolyRow {
  s: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

type SPolySeries = readonly SPolyRow[];

interface StripEval {
  /** +1 for a left strip (id ≥ 0), -1 for a right strip (id < 0). */
  side: 1 | -1;
  /** |id|: 1 = inner, 2 = outer. Used to order strips inner→outer. */
  order: number;
  mode: OdrStripMode;
  width: SPolySeries | null;
  constant: SPolySeries | null;
  linear: SPolySeries | null;
  quadratic: SPolySeries | null;
  cubic: SPolySeries | null;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Convert raw `<coefficients>` nodes into a sorted s-series (malformed → 0). */
function rowsToSeries(rows: readonly unknown[]): SPolySeries {
  const series: SPolyRow[] = [];
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    series.push({
      s: num(o[ATTR_PREFIX + 's']),
      a: num(o[ATTR_PREFIX + 'a']),
      b: num(o[ATTR_PREFIX + 'b']),
      c: num(o[ATTR_PREFIX + 'c']),
      d: num(o[ATTR_PREFIX + 'd']),
    });
  }
  series.sort((x, y) => x.s - y.s);
  return series;
}

/**
 * Extract the coefficient series from a strip polynomial leaf child
 * (`<width>`/`<constant>`/`<linear>`/…). The leaf wraps `<coefficients>` rows;
 * `<width>` arrives as a single-element array (forced by the parser), the others
 * as a bare object — `ensureArray` normalizes both.
 */
function seriesFromLeaf(child: OdrExtraChild): SPolySeries {
  const leaf = ensureArray(child.raw)[0];
  if (!leaf || typeof leaf !== 'object') return [];
  const coeffs = (leaf as Record<string, unknown>).coefficients;
  return rowsToSeries(ensureArray(coeffs));
}

/** Extract the coefficient series directly under an extra (used for `<tOffset>`,
 *  whose children are `<coefficients>` rows, not a wrapping leaf). */
function seriesFromCoeffChildren(extra: OdrExtra | undefined): SPolySeries {
  if (!extra?.children) return [];
  const rows: unknown[] = [];
  for (const c of extra.children) {
    if (c.name === 'coefficients') rows.push(...ensureArray(c.raw));
  }
  return rowsToSeries(rows);
}

function evalSeries(series: SPolySeries | null, s: number): number {
  if (!series || series.length === 0) return 0;
  const row = findRecordAtS(series, s, (r) => r.s);
  if (!row) return 0;
  return evalCubic(row.a, row.b, row.c, row.d, s - row.s);
}

/** Build one strip evaluator, or null if the strip carries nothing usable. */
function buildStripEval(strip: OdrCrossSectionStrip, roadId: string): StripEval | null {
  if (strip.id === undefined) {
    console.warn(`crossSectionSurface: road ${roadId} has a <strip> without @id — skipped`);
    return null;
  }

  const se: StripEval = {
    side: strip.id >= 0 ? 1 : -1,
    order: Math.abs(strip.id),
    mode: strip.mode ?? 'independent',
    width: null,
    constant: null,
    linear: null,
    quadratic: null,
    cubic: null,
  };

  for (const child of strip.extra?.children ?? []) {
    switch (child.name) {
      case 'width':
        se.width = seriesFromLeaf(child);
        break;
      case 'constant':
        se.constant = seriesFromLeaf(child);
        break;
      case 'linear':
        se.linear = seriesFromLeaf(child);
        break;
      case 'quadratic':
        se.quadratic = seriesFromLeaf(child);
        break;
      case 'cubic':
        se.cubic = seriesFromLeaf(child);
        break;
    }
  }

  // A strip with neither a width nor any height variant contributes nothing and
  // is almost certainly malformed — warn and drop it rather than distort layout.
  if (!se.width && !se.constant && !se.linear && !se.quadratic && !se.cubic) {
    console.warn(`crossSectionSurface: road ${roadId} strip id=${strip.id} has no polynomials — skipped`);
    return null;
  }

  return se;
}

/** Height contribution of a single strip at outward offset u (metres, ≥ 0). */
function stripHeight(strip: StripEval, s: number, u: number): number {
  let h = 0;
  if (strip.constant) h += evalSeries(strip.constant, s);
  if (strip.linear) h += evalSeries(strip.linear, s) * u;
  if (strip.quadratic) h += evalSeries(strip.quadratic, s) * u * u;
  if (strip.cubic) h += evalSeries(strip.cubic, s) * u * u * u;
  return h;
}

/** Walk one side's strips (inner→outer) and return the surface height at |t|. */
function evalSide(strips: readonly StripEval[], s: number, at: number): number {
  let innerEdge = 0;
  let running = 0; // total height carried to the current inner edge (for relative strips)

  for (let i = 0; i < strips.length; i++) {
    const strip = strips[i];
    const width = strip.width ? Math.max(0, evalSeries(strip.width, s)) : FALLBACK_STRIP_WIDTH;
    const outerEdge = innerEdge + width;
    const isLast = i === strips.length - 1;

    if (at <= outerEdge || isLast) {
      // Clamp u into [0, width] so |t| beyond the outermost edge stays flat.
      const u = Math.min(at, outerEdge) - innerEdge;
      const local = stripHeight(strip, s, u);
      return (strip.mode === 'relative' ? running : 0) + local;
    }

    const edge = stripHeight(strip, s, width);
    running = (strip.mode === 'relative' ? running : 0) + edge;
    innerEdge = outerEdge;
  }

  return running;
}

/**
 * Build a height-field evaluator for a road's authored `<crossSectionSurface>`,
 * or null when the road has none. The returned closure maps road (s, t) — with t
 * measured from the reference line, same as lane-boundary t — to a surface height
 * to add to the road's elevation. Parsing happens once, inside the closure.
 */
export function buildCrossSectionEvaluator(
  road: OdrRoad,
): ((s: number, t: number) => number) | null {
  const css = road.crossSectionSurface;
  if (!css) return null;

  const tOffset = seriesFromCoeffChildren(css.tOffset);

  const left: StripEval[] = [];
  const right: StripEval[] = [];
  for (const strip of css.strips) {
    const se = buildStripEval(strip, road.id);
    if (!se) continue;
    (se.side > 0 ? left : right).push(se);
  }
  left.sort((a, b) => a.order - b.order);
  right.sort((a, b) => a.order - b.order);

  return (s: number, t: number): number => {
    const base = evalSeries(tOffset, s);
    const strips = t >= 0 ? left : right;
    if (strips.length === 0) return base;
    return base + evalSide(strips, s, Math.abs(t));
  };
}

/**
 * Critical s-values where a road's cross-section surface changes polynomial
 * segment (tOffset + every strip leaf's `<coefficients>` rows). Sampling adds
 * these so the mesh places a vertex at each transition. Empty when the road has
 * no cross-section surface.
 */
export function crossSectionCriticalS(road: OdrRoad): number[] {
  const css = road.crossSectionSurface;
  if (!css) return [];

  const out = new Set<number>();
  for (const row of seriesFromCoeffChildren(css.tOffset)) out.add(row.s);
  for (const strip of css.strips) {
    for (const child of strip.extra?.children ?? []) {
      if (
        child.name === 'width' ||
        child.name === 'constant' ||
        child.name === 'linear' ||
        child.name === 'quadratic' ||
        child.name === 'cubic'
      ) {
        for (const row of seriesFromLeaf(child)) out.add(row.s);
      }
    }
  }
  return Array.from(out).sort((a, b) => a - b);
}
