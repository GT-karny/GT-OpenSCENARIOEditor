import { describe, it, expect } from 'vitest';
import type { OpenDriveDocument, OdrJunction } from '@osce/shared';
import { nextNumericId, nextJunctionId } from '../../utils/id-generator.js';
import { createTestDocument } from '../helpers.js';

function makeJunction(id: string): OdrJunction {
  return { id, name: `Junction ${id}`, connections: [] };
}

function docWithJunctions(ids: string[]): OpenDriveDocument {
  return { ...createTestDocument(), junctions: ids.map(makeJunction) };
}

describe('nextNumericId', () => {
  it('returns "1" for an empty list', () => {
    expect(nextNumericId([])).toBe('1');
  });

  it('returns max + 1', () => {
    expect(nextNumericId(['1', '3', '2'])).toBe('4');
  });

  it('ignores non-numeric IDs', () => {
    expect(nextNumericId(['abc', '5', 'uuid-xyz'])).toBe('6');
  });

  it('returns "1" when all IDs are non-numeric', () => {
    expect(nextNumericId(['a', 'b'])).toBe('1');
  });
});

describe('nextJunctionId', () => {
  it('returns "1" when there are no junctions', () => {
    expect(nextJunctionId(createTestDocument())).toBe('1');
  });

  it('returns max numeric junction id + 1', () => {
    expect(nextJunctionId(docWithJunctions(['1', '100', '2']))).toBe('101');
  });

  it('ignores non-numeric junction ids', () => {
    expect(nextJunctionId(docWithJunctions(['j-1', '5']))).toBe('6');
  });

  it('matches the UI derivation (Math.max(0, ...parsed) + 1)', () => {
    // Original UI logic: max of parsed numeric ids (min 0), plus 1.
    const ids = ['3', 'x', '7'];
    const expected = String(
      Math.max(0, ...ids.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n))) + 1,
    );
    expect(nextJunctionId(docWithJunctions(ids))).toBe(expected);
  });
});
