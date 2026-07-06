import { describe, it, expect } from 'vitest';
import {
  PRIVATE_ACTION_TYPES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
} from '@osce/shared';
import {
  PRIVATE_ACTION_SUBCATEGORIES,
  CONDITION_SUBCATEGORIES,
  PALETTE_EXCLUDED_ACTION_TYPES,
  PALETTE_EXCLUDED_CONDITION_TYPES,
} from '../../constants/osc-enum-values';

/**
 * The palette groupings (subcategories) are hand-ordered UI lists, but their
 * union must stay in lockstep with the canonical discriminator lists in
 * @osce/shared. These tests fail if a group gains a stray member or if a new
 * canonical type is added without being placed in a group (or explicitly
 * excluded). The `satisfies` welds in osc-enum-values.ts already reject invalid
 * members at compile time; this is the "no missing" half.
 */
describe('palette subcategory completeness', () => {
  it('PRIVATE_ACTION_SUBCATEGORIES covers PRIVATE_ACTION_TYPES minus exclusions', () => {
    const inPalette = [...new Set(PRIVATE_ACTION_SUBCATEGORIES.flatMap((s) => [...s.types]))];
    const excluded = new Set<string>(PALETTE_EXCLUDED_ACTION_TYPES);
    const expected = PRIVATE_ACTION_TYPES.filter((t) => !excluded.has(t));
    expect([...inPalette].sort()).toEqual([...expected].sort());
  });

  it('PRIVATE_ACTION_SUBCATEGORIES has no duplicate members across groups', () => {
    const flat = PRIVATE_ACTION_SUBCATEGORIES.flatMap((s) => [...s.types]);
    expect(flat.length).toBe(new Set(flat).size);
  });

  it('CONDITION_SUBCATEGORIES covers ENTITY + VALUE condition types minus exclusions', () => {
    const inPalette = [...new Set(CONDITION_SUBCATEGORIES.flatMap((s) => [...s.types]))];
    const excluded = new Set<string>(PALETTE_EXCLUDED_CONDITION_TYPES);
    const expected = [...ENTITY_CONDITION_TYPES, ...VALUE_CONDITION_TYPES].filter(
      (t) => !excluded.has(t),
    );
    expect([...inPalette].sort()).toEqual([...expected].sort());
  });

  it('CONDITION_SUBCATEGORIES has no duplicate members across groups', () => {
    const flat = CONDITION_SUBCATEGORIES.flatMap((s) => [...s.types]);
    expect(flat.length).toBe(new Set(flat).size);
  });
});
