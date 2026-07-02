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
