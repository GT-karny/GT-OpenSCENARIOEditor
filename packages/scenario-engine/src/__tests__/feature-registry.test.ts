import { describe, it, expect } from 'vitest';
import {
  checkFeatureGate,
  ACTION_FEATURE_REGISTRY,
  CONDITION_FEATURE_REGISTRY,
} from '../compatibility/feature-registry';
import {
  SCENARIO_ACTION_TYPES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
} from '@osce/shared';
import type { CompatibilityProfile, OscVersion, SimulatorTarget } from '@osce/shared';

const v12Any: CompatibilityProfile = { oscVersion: '1.2', simulator: 'any' };
const v13Any: CompatibilityProfile = { oscVersion: '1.3', simulator: 'any' };
const v12Esmini: CompatibilityProfile = { oscVersion: '1.2', simulator: 'esmini' };
const v13GtSim: CompatibilityProfile = { oscVersion: '1.3', simulator: 'gt_sim' };

describe('Feature Registry — version gating', () => {
  it('allows v1.2 action in v1.2 profile', () => {
    const result = checkFeatureGate('speedAction', ACTION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(true);
  });

  it('blocks v1.3 action in v1.2 profile', () => {
    const result = checkFeatureGate('connectTrailerAction', ACTION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(false);
    expect(result.minVersion).toBe('1.3');
    expect(result.reasonKey).toBe('featureGate.versionRequired');
  });

  it('allows v1.3 action in v1.3 profile', () => {
    const result = checkFeatureGate('connectTrailerAction', ACTION_FEATURE_REGISTRY, v13Any);
    expect(result.allowed).toBe(true);
  });

  it('blocks disconnectTrailerAction in v1.2 profile', () => {
    const result = checkFeatureGate('disconnectTrailerAction', ACTION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(false);
  });

  it('allows an explicit v1.2 action (teleportAction) in v1.2 profile', () => {
    // teleportAction now has an explicit v1.2 entry in the dense registry.
    const result = checkFeatureGate('teleportAction', ACTION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(true);
  });

  it('falls back to v1.2 for a featureId outside the canonical lists', () => {
    // The DEFAULT_FEATURE safety net still applies to genuinely unknown strings.
    const result = checkFeatureGate('notARealAction', ACTION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(true);
  });
});

describe('Feature Registry — simulator gating', () => {
  it('allows any-simulator feature with specific simulator profile', () => {
    const result = checkFeatureGate('connectTrailerAction', ACTION_FEATURE_REGISTRY, v13GtSim);
    expect(result.allowed).toBe(true);
  });

  it('allows implicit feature with esmini profile', () => {
    const result = checkFeatureGate('speedAction', ACTION_FEATURE_REGISTRY, v12Esmini);
    expect(result.allowed).toBe(true);
  });
});

describe('Feature Registry — condition gating', () => {
  it('allows v1.2 conditions in a v1.2 profile', () => {
    const types = ['distance', 'simulationTime', 'speed', 'collision'];
    for (const type of types) {
      const result = checkFeatureGate(type, CONDITION_FEATURE_REGISTRY, v12Any);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks a v1.3 condition (angle) in a v1.2 profile', () => {
    const result = checkFeatureGate('angle', CONDITION_FEATURE_REGISTRY, v12Any);
    expect(result.allowed).toBe(false);
    expect(result.minVersion).toBe('1.3');
  });

  it('allows a v1.3 condition (relativeAngle) in a v1.3 profile', () => {
    const result = checkFeatureGate('relativeAngle', CONDITION_FEATURE_REGISTRY, v13Any);
    expect(result.allowed).toBe(true);
  });
});

// S4-3: the registries are dense (a Record over the canonical discriminator
// unions). The Record typing already makes a MISSING key a compile error; these
// runtime checks additionally catch EXTRA keys and guard against the Record being
// widened (e.g. to Record<string, FeatureEntry>) later, keeping registry ⇔
// canonical list a two-way equality.
describe('Feature Registry — S4-3: canonical key-set coverage', () => {
  it('ACTION_FEATURE_REGISTRY keys equal SCENARIO_ACTION_TYPES (both directions)', () => {
    expect(Object.keys(ACTION_FEATURE_REGISTRY).sort()).toEqual([...SCENARIO_ACTION_TYPES].sort());
  });

  it('CONDITION_FEATURE_REGISTRY keys equal ENTITY + VALUE condition types (both directions)', () => {
    const canonical = [...ENTITY_CONDITION_TYPES, ...VALUE_CONDITION_TYPES].sort();
    expect(Object.keys(CONDITION_FEATURE_REGISTRY).sort()).toEqual(canonical);
  });
});

describe('Feature Registry — S4-3: entry validity', () => {
  const VALID_OSC_VERSIONS: readonly OscVersion[] = ['1.2', '1.3'];
  const VALID_SIMULATORS: readonly SimulatorTarget[] = ['esmini', 'gt_sim', 'any'];

  it('every action entry has a valid since and a non-empty, valid simulators list', () => {
    const invalid = Object.entries(ACTION_FEATURE_REGISTRY).filter(
      ([, entry]) =>
        !VALID_OSC_VERSIONS.includes(entry.since) ||
        entry.simulators.length === 0 ||
        entry.simulators.some((s) => !VALID_SIMULATORS.includes(s)),
    );
    expect(invalid).toEqual([]);
  });

  it('every condition entry has a valid since and a non-empty, valid simulators list', () => {
    const invalid = Object.entries(CONDITION_FEATURE_REGISTRY).filter(
      ([, entry]) =>
        !VALID_OSC_VERSIONS.includes(entry.since) ||
        entry.simulators.length === 0 ||
        entry.simulators.some((s) => !VALID_SIMULATORS.includes(s)),
    );
    expect(invalid).toEqual([]);
  });
});
