import { describe, it, expect } from 'vitest';
import {
  SIM_GENERATED_OBJECT_ID_MIN,
  isSimGeneratedObject,
  isSimObjectVisible,
  filterSimObjects,
} from '../../../../../features/simulation/lib/wasm/sim-object-filter';

describe('sim-object-filter', () => {
  it('flags ids at/above the synthetic threshold', () => {
    expect(isSimGeneratedObject(SIM_GENERATED_OBJECT_ID_MIN)).toBe(true); // crosswalk
    expect(isSimGeneratedObject(900_000_001)).toBe(true);
    expect(isSimGeneratedObject(910_000_000)).toBe(true); // bridge
    expect(isSimGeneratedObject(920_000_000)).toBe(true); // objectReference clone
  });

  it('does not flag authored/normal ids', () => {
    expect(isSimGeneratedObject(0)).toBe(false);
    expect(isSimGeneratedObject(42)).toBe(false);
    expect(isSimGeneratedObject(899_999_999)).toBe(false);
  });

  it('hides synthetic objects by default and shows them when toggled on', () => {
    expect(isSimObjectVisible(900_000_000, false)).toBe(false);
    expect(isSimObjectVisible(900_000_000, true)).toBe(true);
    expect(isSimObjectVisible(5, false)).toBe(true);
  });

  it('filterSimObjects hides synthetic ids by default', () => {
    const objects = [
      { id: 0, name: 'Ego' },
      { id: 1, name: 'Target' },
      { id: 900_000_000, name: 'crosswalk' },
      { id: 910_000_000, name: 'bridge' },
      { id: 920_000_000, name: 'ref-clone' },
    ];
    const visible = filterSimObjects(objects, false);
    expect(visible.map((o) => o.id)).toEqual([0, 1]);
  });

  it('filterSimObjects shows all objects when toggle is on', () => {
    const objects = [
      { id: 0, name: 'Ego' },
      { id: 900_000_000, name: 'crosswalk' },
    ];
    expect(filterSimObjects(objects, true)).toHaveLength(2);
  });
});
