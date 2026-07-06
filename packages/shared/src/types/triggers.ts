/**
 * Trigger and Condition types for OpenSCENARIO.
 * Triggers contain ConditionGroups (OR logic).
 * ConditionGroups contain Conditions (AND logic).
 */

import type { Position } from './positions.js';
import type {
  ConditionEdge,
  CoordinateSystem,
  Rule,
  RelativeDistanceType,
  DirectionalDimension,
  StoryboardElementType,
  StoryboardElementState,
  TriggeringEntitiesRule,
} from '../enums/osc-enums.js';
import type { Assert, Equals } from './type-utils.js';

// --- Trigger structure ---

export interface Trigger {
  id: string;
  conditionGroups: ConditionGroup[];
}

export interface ConditionGroup {
  id: string;
  conditions: Condition[];
}

export interface Condition {
  id: string;
  name: string;
  delay: number;
  conditionEdge: ConditionEdge;
  condition: ByEntityCondition | ByValueCondition;
}

// --- By Entity Condition ---

export interface ByEntityCondition {
  kind: 'byEntity';
  triggeringEntities: TriggeringEntities;
  entityCondition: EntityCondition;
}

export interface TriggeringEntities {
  triggeringEntitiesRule: TriggeringEntitiesRule;
  entityRefs: string[];
}

export type EntityCondition =
  | DistanceCondition
  | RelativeDistanceCondition
  | TimeHeadwayCondition
  | TimeToCollisionCondition
  | AccelerationCondition
  | SpeedCondition
  | RelativeSpeedCondition
  | ReachPositionCondition
  | StandStillCondition
  | TraveledDistanceCondition
  | EndOfRoadCondition
  | CollisionCondition
  | OffroadCondition
  | RelativeClearanceCondition;

/**
 * Discriminators of {@link EntityCondition}, in union declaration order. Welded
 * to the union by {@link _WeldEntityConditionTypes}.
 */
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
export type EntityConditionType = (typeof ENTITY_CONDITION_TYPES)[number];
type _WeldEntityConditionTypes = Assert<Equals<EntityConditionType, EntityCondition['type']>>;

export interface DistanceCondition {
  type: 'distance';
  value: number;
  freespace: boolean;
  coordinateSystem?: CoordinateSystemCond;
  relativeDistanceType?: RelativeDistanceType;
  rule: Rule;
  position: Position;
}

export interface RelativeDistanceCondition {
  type: 'relativeDistance';
  entityRef: string;
  relativeDistanceType: RelativeDistanceType;
  value: number;
  freespace: boolean;
  rule: Rule;
}

export interface TimeHeadwayCondition {
  type: 'timeHeadway';
  entityRef: string;
  value: number;
  freespace: boolean;
  rule: Rule;
  coordinateSystem?: CoordinateSystemCond;
  alongRoute?: boolean;
}

export interface TimeToCollisionCondition {
  type: 'timeToCollision';
  value: number;
  freespace: boolean;
  rule: Rule;
  coordinateSystem?: CoordinateSystemCond;
  relativeDistanceType?: RelativeDistanceType;
  target: TimeToCollisionTarget;
}

export type TimeToCollisionTarget =
  | { kind: 'position'; position: Position }
  | { kind: 'entity'; entityRef: string };

export interface AccelerationCondition {
  type: 'acceleration';
  value: number;
  rule: Rule;
  direction?: DirectionalDimension;
}

export interface SpeedCondition {
  type: 'speed';
  value: number;
  rule: Rule;
  direction?: DirectionalDimension;
}

export interface RelativeSpeedCondition {
  type: 'relativeSpeed';
  entityRef: string;
  value: number;
  rule: Rule;
  direction?: DirectionalDimension;
}

export interface ReachPositionCondition {
  type: 'reachPosition';
  tolerance: number;
  position: Position;
}

export interface StandStillCondition {
  type: 'standStill';
  duration: number;
}

export interface TraveledDistanceCondition {
  type: 'traveledDistance';
  value: number;
}

export interface EndOfRoadCondition {
  type: 'endOfRoad';
  duration: number;
}

export interface CollisionCondition {
  type: 'collision';
  target: CollisionTarget;
}

export type CollisionTarget =
  | { kind: 'entity'; entityRef: string }
  | { kind: 'objectType'; objectType: string };

export interface OffroadCondition {
  type: 'offroad';
  duration: number;
}

export interface RelativeClearanceCondition {
  type: 'relativeClearance';
  distanceForward?: number;
  distanceBackward?: number;
  freeSpace: boolean;
  oppositeLanes: boolean;
  entityRefs: string[];
  laneRange?: { from: number; to: number }[];
}

// --- By Value Condition ---

export interface ByValueCondition {
  kind: 'byValue';
  valueCondition: ValueCondition;
}

export type ValueCondition =
  | SimulationTimeCondition
  | StoryboardElementStateCondition
  | ParameterCondition
  | VariableCondition
  | TrafficSignalCondition
  | TrafficSignalControllerCondition
  | UserDefinedValueCondition;

/**
 * Discriminators of {@link ValueCondition}, in union declaration order. Welded
 * to the union by {@link _WeldValueConditionTypes}.
 */
export const VALUE_CONDITION_TYPES = [
  'simulationTime',
  'storyboardElementState',
  'parameter',
  'variable',
  'trafficSignal',
  'trafficSignalController',
  'userDefinedValue',
] as const;
export type ValueConditionType = (typeof VALUE_CONDITION_TYPES)[number];
type _WeldValueConditionTypes = Assert<Equals<ValueConditionType, ValueCondition['type']>>;

export interface SimulationTimeCondition {
  type: 'simulationTime';
  value: number;
  rule: Rule;
}

export interface StoryboardElementStateCondition {
  type: 'storyboardElementState';
  storyboardElementRef: string;
  storyboardElementType: StoryboardElementType;
  state: StoryboardElementState;
}

export interface ParameterCondition {
  type: 'parameter';
  parameterRef: string;
  value: string;
  rule: Rule;
}

export interface VariableCondition {
  type: 'variable';
  variableRef: string;
  value: string;
  rule: Rule;
}

export interface TrafficSignalCondition {
  type: 'trafficSignal';
  name: string;
  state: string;
}

export interface TrafficSignalControllerCondition {
  type: 'trafficSignalController';
  trafficSignalControllerRef: string;
  phase: string;
}

export interface UserDefinedValueCondition {
  type: 'userDefinedValue';
  name: string;
  value: string;
  rule: Rule;
}

/** Alias for CoordinateSystem — kept for backward compatibility with existing dependents. */
export type CoordinateSystemCond = CoordinateSystem;
