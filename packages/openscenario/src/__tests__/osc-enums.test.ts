import { describe, it, expect } from 'vitest';
import {
  CLOUD_STATES,
  COORDINATE_SYSTEMS,
  DYNAMICS_SHAPES,
  FRACTIONAL_CLOUD_COVER_VALUES,
  RULES,
  WETNESS_VALUES,
  PRECIPITATION_TYPE_VALUES,
  PRIVATE_ACTION_TYPES,
  GLOBAL_ACTION_TYPES,
  SCENARIO_ACTION_TYPES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
  POSITION_TYPES,
} from '@osce/shared';

/**
 * Guards against enum drift from the ASAM OpenSCENARIO v1.3.1 XSD. These are
 * high-risk enums (the Phase-0 A1 cloud-state bug class); if the XSD-derived
 * const arrays in @osce/shared change, these assertions fail loudly.
 */
describe('OpenSCENARIO v1.3.1 enum const arrays', () => {
  it('CLOUD_STATES matches the deprecated v1.2 CloudState set (A1 fix values)', () => {
    expect([...CLOUD_STATES]).toEqual(['cloudy', 'free', 'overcast', 'rainy', 'skyOff']);
  });

  it("COORDINATE_SYSTEMS includes the v1.3 addition 'world'", () => {
    expect([...COORDINATE_SYSTEMS]).toEqual(['entity', 'lane', 'road', 'trajectory', 'world']);
    expect(COORDINATE_SYSTEMS).toContain('world');
  });

  it('DYNAMICS_SHAPES matches the XSD DynamicsShape set', () => {
    expect([...DYNAMICS_SHAPES]).toEqual(['cubic', 'linear', 'sinusoidal', 'step']);
  });

  it('FRACTIONAL_CLOUD_COVER_VALUES matches the XSD FractionalCloudCover set', () => {
    expect([...FRACTIONAL_CLOUD_COVER_VALUES]).toEqual([
      'zeroOktas',
      'oneOktas',
      'twoOktas',
      'threeOktas',
      'fourOktas',
      'fiveOktas',
      'sixOktas',
      'sevenOktas',
      'eightOktas',
      'nineOktas',
    ]);
  });

  it('RULES matches the XSD Rule set', () => {
    expect([...RULES]).toEqual([
      'equalTo',
      'greaterThan',
      'lessThan',
      'greaterOrEqual',
      'lessOrEqual',
      'notEqualTo',
    ]);
  });

  it('WETNESS_VALUES matches the XSD Wetness set', () => {
    expect([...WETNESS_VALUES]).toEqual([
      'dry',
      'moist',
      'wetWithPuddles',
      'lowFlooded',
      'highFlooded',
    ]);
  });

  it('PRECIPITATION_TYPE_VALUES matches the XSD PrecipitationType set', () => {
    expect([...PRECIPITATION_TYPE_VALUES]).toEqual(['dry', 'rain', 'snow']);
  });
});

/**
 * Runtime pins for the canonical action/condition/position discriminator lists.
 * The lists are welded to their type unions at compile time in @osce/shared;
 * these assertions give runtime consumers (parser dispatch, palettes, defaults)
 * a fixed member count and guard against accidental duplicates. Update the
 * expected counts deliberately when a spec-driven member is added.
 */
describe('canonical discriminator lists', () => {
  const lists = {
    PRIVATE_ACTION_TYPES,
    GLOBAL_ACTION_TYPES,
    SCENARIO_ACTION_TYPES,
    ENTITY_CONDITION_TYPES,
    VALUE_CONDITION_TYPES,
    POSITION_TYPES,
  };

  it.each(Object.entries(lists))('%s has no duplicate members', (_name, list) => {
    expect(list.length).toBe(new Set(list).size);
  });

  it('has the expected member counts', () => {
    expect(PRIVATE_ACTION_TYPES.length).toBe(20);
    // +1 setMonitorAction (v1.3)
    expect(GLOBAL_ACTION_TYPES.length).toBe(7);
    expect(SCENARIO_ACTION_TYPES.length).toBe(28);
    // +2 angle, relativeAngle (v1.3)
    expect(ENTITY_CONDITION_TYPES.length).toBe(16);
    expect(VALUE_CONDITION_TYPES.length).toBe(7);
    expect(POSITION_TYPES.length).toBe(10);
  });

  it('SCENARIO_ACTION_TYPES is private + global + userDefinedAction', () => {
    expect([...SCENARIO_ACTION_TYPES]).toEqual([
      ...PRIVATE_ACTION_TYPES,
      ...GLOBAL_ACTION_TYPES,
      'userDefinedAction',
    ]);
  });
});
