/**
 * Action types for OpenSCENARIO.
 * Actions are organized into Private, Global, and UserDefined.
 * Uses discriminated unions with `type` field.
 */

import type { Position } from './positions.js';
import type { Property } from './scenario.js';
import type {
  DynamicsShape,
  DynamicsDimension,
  FollowingMode,
  CoordinateSystem,
  LateralDisplacement,
  LongitudinalDisplacement,
} from '../enums/osc-enums.js';

// --- Top-level Action wrapper ---

export interface ScenarioAction {
  id: string;
  name: string;
  action: PrivateAction | GlobalAction | UserDefinedAction;
}

// --- Private Actions (entity-specific) ---

export type PrivateAction =
  | SpeedAction
  | SpeedProfileAction
  | LaneChangeAction
  | LaneOffsetAction
  | LateralDistanceAction
  | LongitudinalDistanceAction
  | TeleportAction
  | SynchronizeAction
  | FollowTrajectoryAction
  | AcquirePositionAction
  | RoutingAction
  | AssignControllerAction
  | ActivateControllerAction
  | OverrideControllerAction
  | VisibilityAction
  | AppearanceAction
  | AnimationAction
  | LightStateAction
  | ConnectTrailerAction
  | DisconnectTrailerAction;

export interface SpeedAction {
  type: 'speedAction';
  dynamics: TransitionDynamics;
  target: SpeedTarget;
}

export interface SpeedProfileAction {
  type: 'speedProfileAction';
  entityRef?: string;
  followingMode: FollowingMode;
  dynamicsDimension?: DynamicsDimension;
  entries: SpeedProfileEntry[];
}

export interface SpeedProfileEntry {
  speed: number;
  time?: number;
}

export interface LaneChangeAction {
  type: 'laneChangeAction';
  dynamics: TransitionDynamics;
  target: LaneChangeTarget;
  targetLaneOffset?: number;
}

export interface LaneOffsetAction {
  type: 'laneOffsetAction';
  continuous: boolean;
  dynamics: LaneOffsetDynamics;
  target: LaneOffsetTarget;
}

export interface LateralDistanceAction {
  type: 'lateralDistanceAction';
  entityRef: string;
  distance?: number;
  freespace: boolean;
  continuous: boolean;
  coordinateSystem?: CoordinateSystem;
  displacement?: LateralDisplacement;
  dynamics?: DynamicConstraints;
}

export interface LongitudinalDistanceAction {
  type: 'longitudinalDistanceAction';
  entityRef: string;
  distance?: number;
  timeGap?: number;
  freespace: boolean;
  continuous: boolean;
  coordinateSystem?: CoordinateSystem;
  displacement?: LongitudinalDisplacement;
  dynamics?: DynamicConstraints;
}

export interface TeleportAction {
  type: 'teleportAction';
  position: Position;
}

export interface SynchronizeAction {
  type: 'synchronizeAction';
  masterEntityRef: string;
  targetPositionMaster: Position;
  targetPosition: Position;
  finalSpeed?: FinalSpeed;
  toleranceMaster?: number;
  tolerance?: number;
}

export interface FollowTrajectoryAction {
  type: 'followTrajectoryAction';
  trajectory: Trajectory;
  timeReference: TimeReference;
  followingMode: FollowingMode;
  initialDistanceOffset?: number;
}

export interface AcquirePositionAction {
  type: 'acquirePositionAction';
  position: Position;
}

export interface RoutingAction {
  type: 'routingAction';
  routeAction: 'assignRoute' | 'followToConnectingRoad' | 'acquirePosition';
  route?: { name: string; closed: boolean; waypoints: Array<{ position: Position; routeStrategy: string }> };
  position?: Position;
}

export interface AssignControllerAction {
  type: 'assignControllerAction';
  activateLateral?: boolean;
  activateLongitudinal?: boolean;
  activateAnimation?: boolean;
  activateLighting?: boolean;
  controller?: { name: string; properties: Property[] };
  catalogReference?: { catalogName: string; entryName: string };
}

export interface ActivateControllerAction {
  type: 'activateControllerAction';
  lateral?: boolean;
  longitudinal?: boolean;
  animation?: boolean;
  lighting?: boolean;
  controllerRef?: string;
}

export interface OverrideControllerAction {
  type: 'overrideControllerAction';
  throttle?: OverrideValue;
  brake?: OverrideValue;
  clutch?: OverrideValue;
  parkingBrake?: OverrideValue;
  steeringWheel?: OverrideValue;
  gear?: OverrideGearValue;
}

export interface VisibilityAction {
  type: 'visibilityAction';
  graphics: boolean;
  traffic: boolean;
  sensors: boolean;
  entityRef?: string;
}

export interface AppearanceAction {
  type: 'appearanceAction';
  /** Placeholder - detailed sub-actions to be defined */
  [key: string]: unknown;
}

export interface AnimationAction {
  type: 'animationAction';
  animationType: string;
  state?: string;
  duration?: number;
  loop?: boolean;
}

export interface LightStateAction {
  type: 'lightStateAction';
  lightType: string;
  mode: 'on' | 'off' | 'flashing';
  intensity?: number;
  color?: { r: number; g: number; b: number };
  transitionTime?: number;
}

export interface ConnectTrailerAction {
  type: 'connectTrailerAction';
  trailerRef: string;
}

export interface DisconnectTrailerAction {
  type: 'disconnectTrailerAction';
}

// --- Global Actions ---

export type GlobalAction =
  | EnvironmentAction
  | EntityAction
  | ParameterAction
  | VariableAction
  | InfrastructureAction
  | TrafficAction;

export interface EnvironmentAction {
  type: 'environmentAction';
  environment: Environment;
}

export interface Environment {
  name: string;
  timeOfDay: TimeOfDay;
  weather: Weather;
  roadCondition: RoadCondition;
}

export interface TimeOfDay {
  animation: boolean;
  dateTime: string;
}

export interface Weather {
  fractionalCloudCover?: string;
  atmosphericPressure?: number;
  temperature?: number;
  sun?: { intensity: number; azimuth: number; elevation: number };
  fog?: { visualRange: number; boundingBox?: { center: { x: number; y: number; z: number }; dimensions: { width: number; length: number; height: number } } };
  precipitation?: { precipitationType: string; precipitationIntensity: number };
  wind?: { direction: number; speed: number };
}

export interface RoadCondition {
  frictionScaleFactor: number;
  wetness?: string;
}

export interface EntityAction {
  type: 'entityAction';
  entityRef: string;
  actionType: 'addEntity' | 'deleteEntity';
  position?: Position;
}

export interface ParameterAction {
  type: 'parameterAction';
  parameterRef: string;
  actionType: 'set' | 'modify';
  value?: string;
  rule?: string;
  modifyValue?: number;
}

export interface VariableAction {
  type: 'variableAction';
  variableRef: string;
  actionType: 'set' | 'modify';
  value?: string;
  rule?: string;
  modifyValue?: number;
}

export interface InfrastructureAction {
  type: 'infrastructureAction';
  trafficSignalAction: TrafficSignalAction;
}

export interface TrafficSignalAction {
  controllerRef?: string;
  controllerAction?: { phase: string };
  stateAction?: { name: string; state: string };
}

export interface TrafficAction {
  type: 'trafficAction';
  /** Traffic action details - source, sink, swarm, etc. */
  [key: string]: unknown;
}

export interface UserDefinedAction {
  type: 'userDefinedAction';
  customCommandAction: string;
}

// --- Supporting types ---

export interface TransitionDynamics {
  dynamicsShape: DynamicsShape;
  dynamicsDimension: DynamicsDimension;
  value: number;
}


export type SpeedTarget =
  | { kind: 'absolute'; value: number }
  | { kind: 'relative'; entityRef: string; value: number; speedTargetValueType: 'delta' | 'factor'; continuous: boolean };

export type LaneChangeTarget =
  | { kind: 'absolute'; value: number }
  | { kind: 'relative'; entityRef: string; value: number };

export type LaneOffsetTarget =
  | { kind: 'absolute'; value: number }
  | { kind: 'relative'; entityRef: string; value: number };

export interface LaneOffsetDynamics {
  maxSpeed?: number;
  maxLateralAcc?: number;
  dynamicsShape?: DynamicsShape;
}

export interface DynamicConstraints {
  maxAcceleration?: number;
  maxDeceleration?: number;
  maxSpeed?: number;
}

export interface FinalSpeed {
  absoluteSpeed?: { value: number; steadyState?: boolean };
  relativeSpeedToMaster?: { value: number; speedTargetValueType: 'delta' | 'factor'; steadyState?: boolean };
}

export interface Trajectory {
  name: string;
  closed: boolean;
  shape: TrajectoryShape;
}

export type TrajectoryShape =
  | { type: 'polyline'; vertices: TrajectoryVertex[] }
  | { type: 'clothoid'; curvature: number; curvatureDot: number; length: number; startTime?: number; stopTime?: number; position?: Position }
  | { type: 'nurbs'; order: number; controlPoints: NurbsControlPoint[]; knots: number[] };

export interface TrajectoryVertex {
  position: Position;
  time?: number;
}

export interface NurbsControlPoint {
  position: Position;
  time?: number;
  weight?: number;
}

export interface TimeReference {
  none?: boolean;
  timing?: { domainAbsoluteRelative: 'absolute' | 'relative'; offset: number; scale: number };
}

export interface OverrideValue {
  value: number;
  active: boolean;
  maxRate?: number;
}

export interface OverrideGearValue {
  number?: number;
  active: boolean;
}
