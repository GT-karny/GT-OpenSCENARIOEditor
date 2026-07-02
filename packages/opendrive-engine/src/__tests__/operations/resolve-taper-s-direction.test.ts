import { describe, it, expect } from 'vitest';
import type { TaperDirection } from '../../operations/lane-taper-operations.js';
import { resolveTaperSDirection } from '../../operations/lane-taper-operations.js';

// resolveTaperSDirection converts a driver-perspective taper direction into a
// road-s direction. A lane travels against +s iff
// (side === 'left') === (trafficRule === 'RHT'); when it does, the direction
// flips. This table enumerates all side x direction x rule combinations.

interface Case {
  side: 'left' | 'right';
  direction: TaperDirection;
  rule: 'RHT' | 'LHT';
  expected: TaperDirection;
}

const N2W: TaperDirection = 'narrow-to-wide';
const W2N: TaperDirection = 'wide-to-narrow';

// RHT: left lanes travel against +s (flip), right lanes with +s (no flip).
// LHT: right lanes travel against +s (flip), left lanes with +s (no flip).
const cases: Case[] = [
  // --- RHT ---
  { side: 'left', direction: N2W, rule: 'RHT', expected: W2N },
  { side: 'left', direction: W2N, rule: 'RHT', expected: N2W },
  { side: 'right', direction: N2W, rule: 'RHT', expected: N2W },
  { side: 'right', direction: W2N, rule: 'RHT', expected: W2N },
  // --- LHT ---
  { side: 'left', direction: N2W, rule: 'LHT', expected: N2W },
  { side: 'left', direction: W2N, rule: 'LHT', expected: W2N },
  { side: 'right', direction: N2W, rule: 'LHT', expected: W2N },
  { side: 'right', direction: W2N, rule: 'LHT', expected: N2W },
];

describe('resolveTaperSDirection', () => {
  for (const c of cases) {
    it(`${c.rule}: ${c.side} ${c.direction} -> ${c.expected}`, () => {
      expect(resolveTaperSDirection(c.side, c.direction, c.rule)).toBe(c.expected);
    });
  }

  it('defaults trafficRule to RHT (flip only for left side)', () => {
    // Matches the road editor's original behavior bit-for-bit.
    expect(resolveTaperSDirection('left', N2W)).toBe(W2N);
    expect(resolveTaperSDirection('left', W2N)).toBe(N2W);
    expect(resolveTaperSDirection('right', N2W)).toBe(N2W);
    expect(resolveTaperSDirection('right', W2N)).toBe(W2N);
  });
});
