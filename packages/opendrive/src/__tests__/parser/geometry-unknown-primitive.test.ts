/**
 * Regression test for FIX B4: unknown geometry must NOT be silently coerced
 * into a <line>. Previously the parser fabricated a straight line for any
 * unrecognized primitive, corrupting the road shape. The fix throws an explicit
 * error naming the unsupported primitive; the five known primitives are
 * unaffected.
 */

import { describe, it, expect } from 'vitest';
import { parseGeometry } from '../../parser/parse-geometry.js';

/** Build a raw geometry node the way fast-xml-parser would (attrs prefixed @_). */
function rawGeometry(child: Record<string, unknown>): Record<string, unknown> {
  return {
    '@_s': 0,
    '@_x': 0,
    '@_y': 0,
    '@_hdg': 0,
    '@_length': 10,
    ...child,
  };
}

describe('FIX B4 — unknown geometry primitive is not forced to <line>', () => {
  it('throws an explicit error naming the unsupported primitive', () => {
    const raw = rawGeometry({ nurbs: { '@_order': 3 } });
    expect(() => parseGeometry(raw)).toThrowError(/Unsupported OpenDRIVE geometry primitive/);
    expect(() => parseGeometry(raw)).toThrowError(/nurbs/);
  });

  it('throws when no primitive is present at all (does not fabricate a line)', () => {
    const raw = rawGeometry({});
    expect(() => parseGeometry(raw)).toThrowError(/Unsupported OpenDRIVE geometry primitive/);
  });

  it('still parses all five known primitives', () => {
    expect(parseGeometry(rawGeometry({ line: '' })).type).toBe('line');
    expect(parseGeometry(rawGeometry({ arc: { '@_curvature': 0.01 } })).type).toBe('arc');
    expect(
      parseGeometry(rawGeometry({ spiral: { '@_curvStart': 0, '@_curvEnd': 0.01 } })).type,
    ).toBe('spiral');
    expect(
      parseGeometry(rawGeometry({ poly3: { '@_a': 0, '@_b': 0, '@_c': 0, '@_d': 0 } })).type,
    ).toBe('poly3');
    expect(
      parseGeometry(
        rawGeometry({
          paramPoly3: {
            '@_aU': 0, '@_bU': 1, '@_cU': 0, '@_dU': 0,
            '@_aV': 0, '@_bV': 0, '@_cV': 0, '@_dV': 0,
            '@_pRange': 'arcLength',
          },
        }),
      ).type,
    ).toBe('paramPoly3');
  });
});
