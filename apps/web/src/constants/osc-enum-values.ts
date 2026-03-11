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
  Rule,
  ControllerType,
  ParameterType,
  RouteStrategy,
} from '@osce/shared';
import type { EventPriority } from '@osce/shared';

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

export const RULES: readonly Rule[] = [
  'equalTo',
  'greaterThan',
  'lessThan',
  'greaterOrEqual',
  'lessOrEqual',
  'notEqualTo',
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

export const PRIVATE_ACTION_TYPES = [
  'speedAction',
  'speedProfileAction',
  'laneChangeAction',
  'laneOffsetAction',
  'lateralDistanceAction',
  'longitudinalDistanceAction',
  'teleportAction',
  'synchronizeAction',
  'followTrajectoryAction',
  'acquirePositionAction',
  'routingAction',
  'assignControllerAction',
  'activateControllerAction',
  'overrideControllerAction',
  'visibilityAction',
  'appearanceAction',
  'animationAction',
  'lightStateAction',
  'connectTrailerAction',
  'disconnectTrailerAction',
] as const;

export const GLOBAL_ACTION_TYPES = [
  'environmentAction',
  'entityAction',
  'parameterAction',
  'variableAction',
  'infrastructureAction',
  'trafficAction',
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
] as const;

export const GLOBAL_ACTION_ORDER = [
  'environmentAction',
  'entityAction',
  'trafficAction',
  'infrastructureAction',
  'parameterAction',
  'variableAction',
] as const;

export const ENTITY_CONDITION_TYPES = [
  'distance',
  'relativeDistance',
  'timeHeadway',
  'timeToCollision',
  'acceleration',
  'speed',
  'relativeSpeed',
  'reachPosition',
  'standStill',
  'traveledDistance',
  'endOfRoad',
  'collision',
  'offroad',
  'relativeClearance',
] as const;

export const VALUE_CONDITION_TYPES = [
  'simulationTime',
  'storyboardElementState',
  'parameter',
  'variable',
  'trafficSignal',
  'trafficSignalController',
  'userDefinedValue',
] as const;

export const CONDITION_SUBCATEGORIES = [
  { key: 'distance', types: ['distance', 'relativeDistance', 'reachPosition'] },
  { key: 'time', types: ['timeHeadway', 'timeToCollision', 'simulationTime'] },
  { key: 'motion', types: ['speed', 'relativeSpeed', 'acceleration'] },
  { key: 'travel', types: ['standStill', 'traveledDistance', 'endOfRoad'] },
  { key: 'interaction', types: ['collision', 'offroad', 'relativeClearance'] },
  { key: 'signal', types: ['trafficSignal', 'trafficSignalController'] },
  { key: 'storyboard', types: ['storyboardElementState'] },
  { key: 'data', types: ['parameter', 'variable', 'userDefinedValue'] },
] as const;
