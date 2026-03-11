import { describe, it, expect } from 'vitest';
import { classifySignal } from '../../utils/signal-geometry.js';
import type { OdrSignal } from '@osce/shared';

function makeSignal(overrides: Partial<OdrSignal> = {}): OdrSignal {
  return {
    id: '1',
    s: 0,
    t: 0,
    orientation: '+',
    ...overrides,
  };
}

describe('classifySignal', () => {
  it('returns trafficLight for dynamic=yes', () => {
    expect(classifySignal(makeSignal({ dynamic: 'yes' }))).toBe('trafficLight');
  });

  it('returns trafficLight for esmini type 1000001', () => {
    expect(classifySignal(makeSignal({ type: '1000001' }))).toBe('trafficLight');
  });

  it('returns trafficLight for esmini type 1000002 (pedestrian signal)', () => {
    expect(classifySignal(makeSignal({ type: '1000002' }))).toBe('trafficLight');
  });

  it('returns stopSign for German StVO 206', () => {
    expect(classifySignal(makeSignal({ type: '206' }))).toBe('stopSign');
  });

  it('returns speedLimit for German StVO 274', () => {
    expect(classifySignal(makeSignal({ type: '274' }))).toBe('speedLimit');
  });

  it('returns speedLimit for German StVO 278', () => {
    expect(classifySignal(makeSignal({ type: '278' }))).toBe('speedLimit');
  });

  it('returns generic for unknown type', () => {
    expect(classifySignal(makeSignal({ type: '999' }))).toBe('generic');
  });

  it('returns generic when no type or dynamic set', () => {
    expect(classifySignal(makeSignal())).toBe('generic');
  });

  it('dynamic=yes takes priority over type', () => {
    expect(classifySignal(makeSignal({ dynamic: 'yes', type: '206' }))).toBe('trafficLight');
  });
});
