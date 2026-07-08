import type {
  OscVersion,
  SimulatorTarget,
  FeatureGateResult,
  CompatibilityProfile,
  ScenarioActionType,
  EntityConditionType,
  ValueConditionType,
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
//
// Dense, not sparse: every canonical discriminator has an explicit entry. The
// `Record<...Type, FeatureEntry>` typing makes a missing key a compile error, so
// adding a member to the canonical union forces a registry decision here. Each
// feature is either the v1.2 baseline (present in the v1.2 XSD, all simulators)
// or a v1.3 addition. Resolved formerly-commented v1.3 entries:
//   - randomRouteAction: not a distinct feature — modeled as routingAction with
//     routeAction: 'randomRoute', so it is gated as `routingAction` (v1.2).
//   - trafficAreaAction: rides the `trafficAction` passthrough (no own
//     discriminator), so it is gated as `trafficAction` (v1.2).
//   - setMonitorAction / angle / relativeAngle: now first-class v1.3 members.

/** v1.2 baseline: present in the v1.2 XSD, supported by all simulators. */
const SINCE_12: FeatureEntry = { since: '1.2', simulators: ['any'] };
/** v1.3 addition: supported by all simulators that implement v1.3. */
const SINCE_13: FeatureEntry = { since: '1.3', simulators: ['any'] };

/** When each action discriminator was introduced (and simulator support). */
export const ACTION_FEATURE_REGISTRY: Record<ScenarioActionType, FeatureEntry> = {
  // Private actions
  speedAction: SINCE_12,
  speedProfileAction: SINCE_12,
  laneChangeAction: SINCE_12,
  laneOffsetAction: SINCE_12,
  lateralDistanceAction: SINCE_12,
  longitudinalDistanceAction: SINCE_12,
  teleportAction: SINCE_12,
  synchronizeAction: SINCE_12,
  followTrajectoryAction: SINCE_12,
  acquirePositionAction: SINCE_12,
  routingAction: SINCE_12,
  assignControllerAction: SINCE_12,
  activateControllerAction: SINCE_12,
  overrideControllerAction: SINCE_12,
  visibilityAction: SINCE_12,
  appearanceAction: SINCE_12,
  animationAction: SINCE_12,
  lightStateAction: SINCE_12,
  connectTrailerAction: SINCE_13,
  disconnectTrailerAction: SINCE_13,
  // Global actions
  environmentAction: SINCE_12,
  entityAction: SINCE_12,
  parameterAction: SINCE_12,
  variableAction: SINCE_12,
  infrastructureAction: SINCE_12,
  trafficAction: SINCE_12,
  setMonitorAction: SINCE_13,
  // User-defined
  userDefinedAction: SINCE_12,
};

/** When each condition discriminator was introduced (and simulator support). */
export const CONDITION_FEATURE_REGISTRY: Record<
  EntityConditionType | ValueConditionType,
  FeatureEntry
> = {
  // Entity conditions
  distance: SINCE_12,
  relativeDistance: SINCE_12,
  timeHeadway: SINCE_12,
  timeToCollision: SINCE_12,
  acceleration: SINCE_12,
  speed: SINCE_12,
  relativeSpeed: SINCE_12,
  reachPosition: SINCE_12,
  standStill: SINCE_12,
  traveledDistance: SINCE_12,
  endOfRoad: SINCE_12,
  collision: SINCE_12,
  offroad: SINCE_12,
  relativeClearance: SINCE_12,
  angle: SINCE_13,
  relativeAngle: SINCE_13,
  // Value conditions
  simulationTime: SINCE_12,
  storyboardElementState: SINCE_12,
  parameter: SINCE_12,
  variable: SINCE_12,
  trafficSignal: SINCE_12,
  trafficSignalController: SINCE_12,
  userDefinedValue: SINCE_12,
};

// ---------------------------------------------------------------------------
// Gate check
// ---------------------------------------------------------------------------

// Runtime safety net for a featureId outside the canonical lists. The dense
// records above (plus Wave J's key-coverage test) make this unreachable for any
// real discriminator; it only guards genuinely unknown input strings.
const DEFAULT_FEATURE: FeatureEntry = SINCE_12;

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
