import { describe, it, expect } from 'vitest';
import {
  checkFeatureGate,
  ACTION_FEATURE_REGISTRY,
  CONDITION_FEATURE_REGISTRY,
} from '../compatibility/feature-registry';
import type { CompatibilityProfile } from '@osce/shared';

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
