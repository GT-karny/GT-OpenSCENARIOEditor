import { describe, expect, it } from 'vitest';
import { ROAD_MARK_TYPES } from '../../../../components/opendrive/property/OdrLanePropertyEditor';

/**
 * Regression for the compound roadMark token bug: the UI previously emitted
 * underscore tokens ('solid_solid') which are schema-invalid. The OpenDRIVE XSD
 * e_roadMarkType uses SPACE-separated tokens, and the serializer/parser + viewers
 * expect the same form.
 */
describe('ROAD_MARK_TYPES', () => {
  it('uses XSD space-separated tokens (no underscores)', () => {
    for (const type of ROAD_MARK_TYPES) {
      expect(type).not.toContain('_');
    }
  });

  it('includes the compound marks in space-separated form', () => {
    expect(ROAD_MARK_TYPES).toContain('solid solid');
    expect(ROAD_MARK_TYPES).toContain('solid broken');
    expect(ROAD_MARK_TYPES).toContain('broken solid');
    expect(ROAD_MARK_TYPES).toContain('broken broken');
    expect(ROAD_MARK_TYPES).toContain('botts dots');
  });
});
