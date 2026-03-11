import type {
  OscVersion,
  SimulatorTarget,
  FeatureGateResult,
  CompatibilityProfile,
} from '@osce/shared';

/**
 * Metadata describing when a feature was introduced and which simulators support it.
 * Features NOT listed in a registry are implicitly v1.2 + all simulators.
 */
export interface FeatureEntry {
  since: OscVersion;
  simulators: SimulatorTarget[];
}

// ---------------------------------------------------------------------------
// Version comparison
// ---------------------------------------------------------------------------

const VERSION_ORDER: Record<OscVersion, number> = {
  '1.2': 120,
  '1.3': 130,
};

function versionGte(profile: OscVersion, required: OscVersion): boolean {
  return VERSION_ORDER[profile] >= VERSION_ORDER[required];
}

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

/** Action types that require a specific version or simulator. */
export const ACTION_FEATURE_REGISTRY: Record<string, FeatureEntry> = {
  // v1.3-only actions
  connectTrailerAction: { since: '1.3', simulators: ['any'] },
  disconnectTrailerAction: { since: '1.3', simulators: ['any'] },
  // Future v1.3 additions (uncomment when types are added to @osce/shared):
  // randomRouteAction: { since: '1.3', simulators: ['any'] },
  // setMonitorAction: { since: '1.3', simulators: ['any'] },
  // trafficAreaAction: { since: '1.3', simulators: ['any'] },
};

/** Condition types that require a specific version or simulator. */
export const CONDITION_FEATURE_REGISTRY: Record<string, FeatureEntry> = {
  // Future v1.3 conditions (uncomment when types are added to @osce/shared):
  // angle: { since: '1.3', simulators: ['any'] },
  // relativeAngle: { since: '1.3', simulators: ['any'] },
};

// ---------------------------------------------------------------------------
// Gate check
// ---------------------------------------------------------------------------

const DEFAULT_FEATURE: FeatureEntry = { since: '1.2', simulators: ['any'] };

/**
 * Check whether a feature is allowed under the given compatibility profile.
 */
export function checkFeatureGate(
  featureId: string,
  registry: Record<string, FeatureEntry>,
  profile: CompatibilityProfile,
): FeatureGateResult {
  const entry = registry[featureId] ?? DEFAULT_FEATURE;

  // Version check
  if (!versionGte(profile.oscVersion, entry.since)) {
    return {
      allowed: false,
      reason: `Requires OpenSCENARIO v${entry.since}`,
      reasonKey: 'featureGate.versionRequired',
      minVersion: entry.since,
    };
  }

  // Simulator check
  if (
    profile.simulator !== 'any' &&
    !entry.simulators.includes('any') &&
    !entry.simulators.includes(profile.simulator)
  ) {
    return {
      allowed: false,
      reason: `Not supported by ${profile.simulator}`,
      reasonKey: 'featureGate.simulatorUnsupported',
    };
  }

  return { allowed: true };
}
