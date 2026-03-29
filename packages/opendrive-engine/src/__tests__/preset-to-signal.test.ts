import { describe, it, expect } from 'vitest';
import type { OdrSignal } from '@osce/shared';
import type { SignalHeadPreset } from '../signal/signal-presets.js';
import { BUILT_IN_PRESETS } from '../signal/signal-presets.js';
import { presetToSignalPartial, signalToPresetId } from '../signal/preset-to-signal.js';

function makeSignal(overrides: Partial<OdrSignal> = {}): OdrSignal {
  return {
    id: 'test-signal',
    s: 0,
    t: 0,
    orientation: '+',
    ...overrides,
  } as OdrSignal;
}

function getPreset(id: string): SignalHeadPreset {
  const p = BUILT_IN_PRESETS.find((b) => b.id === id);
  if (!p) throw new Error(`Preset "${id}" not found`);
  return p;
}

describe('presetToSignalPartial', () => {
  it('maps 3-light-vertical to ASAM type 1000001', () => {
    const result = presetToSignalPartial(getPreset('3-light-vertical'));
    expect(result.type).toBe('1000001');
    expect(result.subtype).toBe('-1');
    expect(result.country).toBe('OpenDRIVE');
    // countryRevision intentionally omitted due to esmini parser bug
    expect(result.countryRevision).toBeUndefined();
    expect(result.dynamic).toBe('yes');
    expect(result.name).toBe('signal:3-light-vertical');
  });

  it('maps 3-light-horizontal to ASAM type 1000001 with horizontal name hint', () => {
    const result = presetToSignalPartial(getPreset('3-light-horizontal'));
    expect(result.type).toBe('1000001');
    expect(result.subtype).toBe('-1');
    expect(result.name).toBe('signal:3-light-horizontal');
  });

  it('maps arrow-left to ASAM type 1000012 subtype 10', () => {
    const result = presetToSignalPartial(getPreset('arrow-left'));
    expect(result.type).toBe('1000012');
    expect(result.subtype).toBe('10');
    expect(result.country).toBe('OpenDRIVE');
  });

  it('maps arrow-right to ASAM type 1000012 subtype 20', () => {
    const result = presetToSignalPartial(getPreset('arrow-right'));
    expect(result.type).toBe('1000012');
    expect(result.subtype).toBe('20');
  });

  it('maps arrow-straight to ASAM type 1000012 subtype 30', () => {
    const result = presetToSignalPartial(getPreset('arrow-straight'));
    expect(result.type).toBe('1000012');
    expect(result.subtype).toBe('30');
  });

  it('maps pedestrian-2 to ASAM type 1000002', () => {
    const result = presetToSignalPartial(getPreset('pedestrian-2'));
    expect(result.type).toBe('1000002');
    expect(result.subtype).toBe('-1');
    expect(result.country).toBe('OpenDRIVE');
  });

  it('all built-in presets produce spec-compliant output', () => {
    for (const preset of BUILT_IN_PRESETS) {
      const result = presetToSignalPartial(preset);
      expect(result.dynamic).toBe('yes');
      expect(result.country).toBe('OpenDRIVE');
      expect(result.name).toBe(`signal:${preset.id}`);
      expect(result.type).not.toBe('trafficLight');
    }
  });
});

describe('signalToPresetId', () => {
  describe('fallback 1: name hint', () => {
    it('resolves from name hint', () => {
      const signal = makeSignal({ name: 'signal:3-light-vertical', type: '1000001', subtype: '-1' });
      expect(signalToPresetId(signal)).toBe('3-light-vertical');
    });

    it('distinguishes horizontal from vertical via name', () => {
      const signal = makeSignal({ name: 'signal:3-light-horizontal', type: '1000001', subtype: '-1' });
      expect(signalToPresetId(signal)).toBe('3-light-horizontal');
    });

    it('ignores invalid name hint and falls through', () => {
      const signal = makeSignal({ name: 'signal:nonexistent', type: '1000001', subtype: '-1' });
      expect(signalToPresetId(signal)).toBe('3-light-vertical');
    });
  });

  describe('fallback 2: ASAM type+subtype', () => {
    it('resolves 1000001 without name hint', () => {
      const signal = makeSignal({ type: '1000001', subtype: '-1' });
      expect(signalToPresetId(signal)).toBe('3-light-vertical');
    });

    it('resolves 1000012:10 as arrow-left', () => {
      const signal = makeSignal({ type: '1000012', subtype: '10' });
      expect(signalToPresetId(signal)).toBe('arrow-left');
    });

    it('resolves 1000012:20 as arrow-right', () => {
      const signal = makeSignal({ type: '1000012', subtype: '20' });
      expect(signalToPresetId(signal)).toBe('arrow-right');
    });

    it('resolves 1000012:30 as arrow-straight', () => {
      const signal = makeSignal({ type: '1000012', subtype: '30' });
      expect(signalToPresetId(signal)).toBe('arrow-straight');
    });

    it('resolves 1000002 as pedestrian-2', () => {
      const signal = makeSignal({ type: '1000002', subtype: '-1' });
      expect(signalToPresetId(signal)).toBe('pedestrian-2');
    });

    it('resolves type-only key when subtype is missing', () => {
      const signal = makeSignal({ type: '1000001' });
      expect(signalToPresetId(signal)).toBe('3-light-vertical');
    });
  });

  describe('fallback 3: legacy subtype = preset ID', () => {
    it('resolves legacy non-standard subtype', () => {
      const signal = makeSignal({ type: 'trafficLight', subtype: '3-light-vertical' });
      expect(signalToPresetId(signal)).toBe('3-light-vertical');
    });

    it('resolves legacy pedestrian subtype', () => {
      const signal = makeSignal({ type: 'trafficLight', subtype: 'pedestrian-2' });
      expect(signalToPresetId(signal)).toBe('pedestrian-2');
    });
  });

  it('returns null for unknown signal', () => {
    const signal = makeSignal({ type: '999', subtype: '999' });
    expect(signalToPresetId(signal)).toBeNull();
  });
});
