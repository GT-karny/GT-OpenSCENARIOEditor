/**
 * Runtime enum value arrays for OpenSCENARIO v1.2.
 * Derived from the union types in @osce/shared (packages/shared/src/enums/osc-enums.ts).
 * Used for <Select> dropdown options in property editors.
 */

import type {
  VehicleCategory,
  PedestrianCategory,
  MiscObjectCategory,
  ConditionEdge,
  DynamicsDimension,
  DynamicsShape,
  ControllerType,
  ParameterType,
  RouteStrategy,
  PrivateActionType,
  GlobalActionType,
  EntityConditionType,
  ValueConditionType,
} from '@osce/shared';
import type { EventPriority } from '@osce/shared';

// Canonical discriminator lists are the single source of truth in @osce/shared
// (welded to the action/condition type unions there). Re-exported here so the
// property editors keep a single import site; the subcategory/ordering lists
// further down are welded against these via `satisfies`.
export {
  PRIVATE_ACTION_TYPES,
  GLOBAL_ACTION_TYPES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
} from '@osce/shared';

export const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  'bicycle',
  'bus',
  'car',
  'motorbike',
  'semitrailer',
  'trailer',
  'train',
  'tram',
  'truck',
  'van',
] as const;

export const PEDESTRIAN_CATEGORIES: readonly PedestrianCategory[] = [
  'animal',
  'pedestrian',
  'wheelchair',
] as const;

export const MISC_OBJECT_CATEGORIES: readonly MiscObjectCategory[] = [
  'barrier',
  'building',
  'crosswalk',
  'gantry',
  'none',
  'obstacle',
  'parkingSpace',
  'patch',
  'pole',
  'railing',
  'roadMark',
  'soundBarrier',
  'streetLamp',
  'trafficIsland',
  'tree',
  'vegetation',
  'wind',
] as const;

export const CONTROLLER_TYPES: readonly ControllerType[] = [
  'lateral',
  'longitudinal',
  'lighting',
  'animation',
  'movement',
  'appearance',
  'all',
] as const;

export const PARAMETER_TYPES: readonly ParameterType[] = [
  'string',
  'double',
  'int',
  'boolean',
  'dateTime',
  'unsignedInt',
  'unsignedShort',
] as const;

export const CONDITION_EDGES: readonly ConditionEdge[] = [
  'falling',
  'none',
  'rising',
  'risingOrFalling',
] as const;

export const DYNAMICS_SHAPES: readonly DynamicsShape[] = [
  'cubic',
  'linear',
  'sinusoidal',
  'step',
] as const;

export const DYNAMICS_DIMENSIONS: readonly DynamicsDimension[] = [
  'time',
  'distance',
  'rate',
] as const;

export const EVENT_PRIORITIES: readonly EventPriority[] = [
  'override',
  'overwrite',
  'skip',
  'parallel',
] as const;

export const ROUTE_STRATEGIES: readonly RouteStrategy[] = [
  'fastest',
  'leastIntersections',
  'random',
  'shortest',
] as const;

export const PRIVATE_ACTION_SUBCATEGORIES = [
  {
    key: 'longitudinal',
    types: ['speedAction', 'longitudinalDistanceAction', 'speedProfileAction'],
  },
  {
    key: 'lateral',
    types: ['laneChangeAction', 'laneOffsetAction', 'lateralDistanceAction'],
  },
  {
    key: 'routing',
    types: [
      'teleportAction',
      'acquirePositionAction',
      'routingAction',
      'followTrajectoryAction',
      'synchronizeAction',
    ],
  },
  {
    key: 'controller',
    types: ['assignControllerAction', 'activateControllerAction', 'overrideControllerAction'],
  },
  {
    key: 'appearance',
    types: ['visibilityAction', 'animationAction', 'lightStateAction', 'appearanceAction'],
  },
  {
    key: 'trailer',
    types: ['connectTrailerAction', 'disconnectTrailerAction'],
  },
] as const satisfies readonly { key: string; types: readonly PrivateActionType[] }[];

// UI ordering for the global-action palette (distinct from GLOBAL_ACTION_TYPES
// declaration order). Welded so every entry is a valid global discriminator;
// the completeness test enforces GLOBAL_ACTION_ORDER ∪ exclusions ==
// GLOBAL_ACTION_TYPES, so an omission must be declared in
// {@link PALETTE_EXCLUDED_GLOBAL_ACTION_TYPES} with a reason.
export const GLOBAL_ACTION_ORDER = [
  'environmentAction',
  'entityAction',
  'trafficAction',
  'infrastructureAction',
  'parameterAction',
  'variableAction',
] as const satisfies readonly GlobalActionType[];

/**
 * Global-action discriminators intentionally omitted from
 * {@link GLOBAL_ACTION_ORDER}. Consumed by the completeness test the same way as
 * {@link PALETTE_EXCLUDED_ACTION_TYPES}.
 */
export const PALETTE_EXCLUDED_GLOBAL_ACTION_TYPES: readonly GlobalActionType[] = [
  // v1.3 type without a dedicated property editor yet (S4); palette exposure
  // pending UI work.
  'setMonitorAction',
];

export const CONDITION_SUBCATEGORIES = [
  { key: 'distance', types: ['distance', 'relativeDistance', 'reachPosition'] },
  { key: 'time', types: ['timeHeadway', 'timeToCollision', 'simulationTime'] },
  { key: 'motion', types: ['speed', 'relativeSpeed', 'acceleration'] },
  { key: 'travel', types: ['standStill', 'traveledDistance', 'endOfRoad'] },
  { key: 'interaction', types: ['collision', 'offroad', 'relativeClearance'] },
  { key: 'signal', types: ['trafficSignal', 'trafficSignalController'] },
  { key: 'storyboard', types: ['storyboardElementState'] },
  { key: 'data', types: ['parameter', 'variable', 'userDefinedValue'] },
] as const satisfies readonly {
  key: string;
  types: readonly (EntityConditionType | ValueConditionType)[];
}[];

/**
 * Action discriminators intentionally omitted from
 * {@link PRIVATE_ACTION_SUBCATEGORIES} (e.g. a type without a palette entry
 * yet). Empty today. The completeness test treats the palette's expected member
 * set as `PRIVATE_ACTION_TYPES` minus this set, so add a type here (with a
 * reason) instead of leaving the palette silently incomplete.
 */
export const PALETTE_EXCLUDED_ACTION_TYPES: readonly PrivateActionType[] = [];

/**
 * Condition discriminators intentionally omitted from
 * {@link CONDITION_SUBCATEGORIES}. Consumed by the completeness test the same way
 * as {@link PALETTE_EXCLUDED_ACTION_TYPES}.
 */
export const PALETTE_EXCLUDED_CONDITION_TYPES: readonly (
  | EntityConditionType
  | ValueConditionType
)[] = [
  // v1.3 types without a dedicated property editor yet (S4); palette exposure
  // pending UI work.
  'angle',
  'relativeAngle',
];
