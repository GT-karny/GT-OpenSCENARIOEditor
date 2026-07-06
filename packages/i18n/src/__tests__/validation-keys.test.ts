import { describe, it, expect } from 'vitest';
import { resources } from '../locales/index.js';

/**
 * Every messageKey emitted by the XoscValidator rules. Kept in sync with the
 * `messageKey` fields in packages/openscenario/src/validator/rules/*. If a rule
 * gains a new key, add it here so the locale coverage stays enforced.
 */
const VALIDATION_KEYS = [
  'struct001',
  'struct002',
  'struct003',
  'struct004',
  'struct005',
  'struct006',
  'struct007',
  'ref001',
  'ref003',
  'val001',
  'val003',
] as const;

describe('validation i18n keys', () => {
  for (const lng of ['en', 'ja'] as const) {
    describe(lng, () => {
      const validation = resources[lng].errors.validation as Record<string, string>;

      for (const key of VALIDATION_KEYS) {
        it(`defines errors.validation.${key}`, () => {
          expect(validation[key]).toBeTruthy();
          expect(typeof validation[key]).toBe('string');
        });
      }

      it('does not resurrect the retired placeholder keys', () => {
        for (const dead of [
          'entityNameDuplicate',
          'missingRoadNetwork',
          'invalidParameter',
          'emptyStoryboard',
          'missingTrigger',
          'circularEntityRef',
          'missingEntityRef',
          'invalidPosition',
          'speedOutOfRange',
          'missingActor',
        ]) {
          expect(validation[dead]).toBeUndefined();
        }
      });
    });
  }
});

/** Collect the sorted dot-paths of every leaf key under a locale subtree. */
function leafPaths(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node as Record<string, unknown>)
    .flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k))
    .sort();
}

/**
 * en/ja key parity for the S5 greenfield i18n sections. A key added to one
 * locale but not the other silently falls back to English at runtime; this
 * pins the two trees to the exact same shape.
 */
describe('en/ja key parity (conditionEditors, odrProperty)', () => {
  for (const section of ['conditionEditors', 'odrProperty'] as const) {
    it(`${section} has identical key sets in en and ja`, () => {
      const en = (resources.en.common as Record<string, unknown>)[section];
      const ja = (resources.ja.common as Record<string, unknown>)[section];
      expect(en, `en common.${section} missing`).toBeTruthy();
      expect(ja, `ja common.${section} missing`).toBeTruthy();
      expect(leafPaths(ja)).toEqual(leafPaths(en));
    });
  }
});
