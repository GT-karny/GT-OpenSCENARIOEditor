import type {
  PrivateAction,
  GlobalAction,
  UserDefinedAction,
  SpeedAction,
  SpeedProfileAction,
  SpeedProfileEntry,
  LaneChangeAction,
  LaneOffsetAction,
  LateralDistanceAction,
  LongitudinalDistanceAction,
  TeleportAction,
  SynchronizeAction,
  FollowTrajectoryAction,
  RoutingAction,
  AssignControllerAction,
  ActivateControllerAction,
  OverrideControllerAction,
  VisibilityAction,
  AppearanceAction,
  AnimationAction,
  LightStateAction,
  ConnectTrailerAction,
  DisconnectTrailerAction,
  EnvironmentAction,
  EntityAction,
  ParameterAction,
  VariableAction,
  InfrastructureAction,
  TrafficAction,
  SetMonitorAction,
  TransitionDynamics,
  SpeedTarget,
  LaneChangeTarget,
  LaneOffsetTarget,
  LaneOffsetDynamics,
  DynamicConstraints,
  FinalSpeed,
  Trajectory,
  TrajectoryShape,
  TrajectoryVertex,
  ClothoidSplineSegment,
  NurbsControlPoint,
  TimeReference,
  OverrideValue,
  OverrideGearValue,
  Environment,
  TimeOfDay,
  Weather,
  RoadCondition,
  TrafficSignalAction,
  Property,
  DynamicsShape,
  DynamicsDimension,
  FollowingMode,
  CoordinateSystem,
  LateralDisplacement,
  LongitudinalDisplacement,
  FractionalCloudCover,
  PrecipitationType,
  Wetness,
  LightMode,
  RouteStrategy,
} from '@osce/shared';
import type { RawXml } from '../utils/xml-helpers.js';
import { parsePosition } from './parse-positions.js';
import { parseParameterDeclarations } from './parse-parameters.js';
import {
  numAttr,
  strAttr,
  optNumAttr,
  optStrAttr,
  boolAttr,
  optBoolAttr,
  pushBindingFieldPrefix,
  popBindingFieldPrefix,
  child,
  children,
  has,
  rawKeys,
} from '../utils/xml-helpers.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a PrivateAction XML element into the internal discriminated union.
 * Handles the intermediate wrapping elements (LongitudinalAction, LateralAction, etc.)
 * and maps them to flat action types.
 */
export function parsePrivateAction(raw: RawXml | undefined): PrivateAction {
  if (!raw) throw new Error('PrivateAction element is missing');

  // --- Longitudinal actions ---
  const longitudinalAction = child(raw, 'LongitudinalAction');
  if (longitudinalAction) {
    return parseLongitudinalAction(longitudinalAction);
  }

  // --- Lateral actions ---
  const lateralAction = child(raw, 'LateralAction');
  if (lateralAction) {
    return parseLateralAction(lateralAction);
  }

  // --- Teleport ---
  const teleportAction = child(raw, 'TeleportAction');
  if (teleportAction) {
    return parseTeleportAction(teleportAction);
  }

  // --- Synchronize ---
  const synchronizeAction = child(raw, 'SynchronizeAction');
  if (synchronizeAction) {
    return parseSynchronizeAction(synchronizeAction);
  }

  // --- Controller actions (wraps Assign/Activate/Override) ---
  const controllerAction = child(raw, 'ControllerAction');
  if (controllerAction) {
    return parseControllerAction(controllerAction);
  }

  // --- Routing actions ---
  const routingAction = child(raw, 'RoutingAction');
  if (routingAction) {
    return parseRoutingAction(routingAction);
  }

  // --- Visibility ---
  const visibilityAction = child(raw, 'VisibilityAction');
  if (visibilityAction) {
    return parseVisibilityAction(visibilityAction);
  }

  // --- Appearance ---
  const appearanceAction = child(raw, 'AppearanceAction');
  if (appearanceAction) {
    return parseAppearanceAction(appearanceAction);
  }

  // --- Animation ---
  const animationAction = child(raw, 'AnimationAction');
  if (animationAction) {
    return parseAnimationAction(animationAction);
  }

  // --- Light state ---
  const lightStateAction = child(raw, 'LightStateAction');
  if (lightStateAction) {
    return parseLightStateAction(lightStateAction);
  }

  // --- Trailer actions ---
  const trailerAction = child(raw, 'TrailerAction');
  if (trailerAction) {
    // TrailerAction wraps Connect/DisconnectTrailerAction
    const connectTrailer = child(trailerAction, 'ConnectTrailerAction');
    if (connectTrailer) {
      return parseConnectTrailerAction(connectTrailer);
    }
    if (has(trailerAction, 'DisconnectTrailerAction')) {
      return parseDisconnectTrailerAction();
    }
  }
  const connectTrailerAction = child(raw, 'ConnectTrailerAction');
  if (connectTrailerAction) {
    return parseConnectTrailerAction(connectTrailerAction);
  }
  if (has(raw, 'DisconnectTrailerAction')) {
    return parseDisconnectTrailerAction();
  }

  // --- Direct controller actions (esmini / v1.0 style, without ControllerAction wrapper) ---
  const activateControllerAction = child(raw, 'ActivateControllerAction');
  if (activateControllerAction) {
    return parseActivateControllerAction(activateControllerAction);
  }
  const assignControllerAction = child(raw, 'AssignControllerAction');
  if (assignControllerAction) {
    return parseAssignControllerAction(assignControllerAction);
  }
  const overrideControllerValueAction = child(raw, 'OverrideControllerValueAction');
  if (overrideControllerValueAction) {
    return parseOverrideControllerAction(overrideControllerValueAction);
  }

  // --- FollowTrajectoryAction directly under PrivateAction (some files) ---
  const followTrajectoryAction = child(raw, 'FollowTrajectoryAction');
  if (followTrajectoryAction) {
    return parseFollowTrajectoryAction(followTrajectoryAction);
  }

  // --- AcquirePositionAction directly under PrivateAction (some files) ---
  const acquirePositionAction = child(raw, 'AcquirePositionAction');
  if (acquirePositionAction) {
    return parseRoutingAcquirePositionAction(acquirePositionAction);
  }

  throw new Error(`Unknown PrivateAction type: ${rawKeys(raw).join(', ')}`);
}

/**
 * Parses a GlobalAction XML element into the internal discriminated union.
 */
export function parseGlobalAction(raw: RawXml | undefined): GlobalAction {
  if (!raw) throw new Error('GlobalAction element is missing');

  const environmentAction = child(raw, 'EnvironmentAction');
  if (environmentAction) {
    return parseEnvironmentAction(environmentAction);
  }
  const entityAction = child(raw, 'EntityAction');
  if (entityAction) {
    return parseEntityAction(entityAction);
  }
  const parameterAction = child(raw, 'ParameterAction');
  if (parameterAction) {
    return parseParameterAction(parameterAction);
  }
  const variableAction = child(raw, 'VariableAction');
  if (variableAction) {
    return parseVariableAction(variableAction);
  }
  const infrastructureAction = child(raw, 'InfrastructureAction');
  if (infrastructureAction) {
    return parseInfrastructureAction(infrastructureAction);
  }
  const trafficAction = child(raw, 'TrafficAction');
  if (trafficAction) {
    return parseTrafficAction(trafficAction);
  }
  const setMonitorAction = child(raw, 'SetMonitorAction');
  if (setMonitorAction) {
    return parseSetMonitorAction(setMonitorAction);
  }

  throw new Error(`Unknown GlobalAction type: ${rawKeys(raw).join(', ')}`);
}

/**
 * Parses a UserDefinedAction XML element.
 */
export function parseUserDefinedAction(raw: RawXml | undefined): UserDefinedAction {
  if (!raw) throw new Error('UserDefinedAction element is missing');
  return {
    type: 'userDefinedAction',
    customCommandAction: strAttr(child(raw, 'CustomCommandAction'), 'type', ''),
  };
}

// ---------------------------------------------------------------------------
// Longitudinal actions
// ---------------------------------------------------------------------------

function parseLongitudinalAction(raw: RawXml): PrivateAction {
  const speedAction = child(raw, 'SpeedAction');
  if (speedAction) {
    return parseSpeedAction(speedAction);
  }
  const speedProfileAction = child(raw, 'SpeedProfileAction');
  if (speedProfileAction) {
    return parseSpeedProfileAction(speedProfileAction);
  }
  const longitudinalDistanceAction = child(raw, 'LongitudinalDistanceAction');
  if (longitudinalDistanceAction) {
    return parseLongitudinalDistanceAction(longitudinalDistanceAction);
  }

  throw new Error(`Unknown LongitudinalAction type: ${rawKeys(raw).join(', ')}`);
}

function parseSpeedAction(raw: RawXml): SpeedAction {
  pushBindingFieldPrefix('dynamics');
  const dynamics = parseTransitionDynamics(child(raw, 'SpeedActionDynamics'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('target');
  const target = parseSpeedTarget(child(raw, 'SpeedActionTarget'));
  popBindingFieldPrefix();

  return { type: 'speedAction', dynamics, target };
}

function parseTransitionDynamics(raw: RawXml | undefined): TransitionDynamics {
  return {
    dynamicsShape: strAttr(raw, 'dynamicsShape', 'linear') as DynamicsShape,
    dynamicsDimension: strAttr(raw, 'dynamicsDimension', 'rate') as DynamicsDimension,
    value: numAttr(raw, 'value'),
  };
}

function parseSpeedTarget(raw: RawXml | undefined): SpeedTarget {
  if (!raw) throw new Error('SpeedActionTarget element is missing');

  const absoluteTargetSpeed = child(raw, 'AbsoluteTargetSpeed');
  if (absoluteTargetSpeed) {
    return {
      kind: 'absolute',
      value: numAttr(absoluteTargetSpeed, 'value'),
    };
  }
  const relativeTargetSpeed = child(raw, 'RelativeTargetSpeed');
  if (relativeTargetSpeed) {
    return {
      kind: 'relative',
      entityRef: strAttr(relativeTargetSpeed, 'entityRef'),
      value: numAttr(relativeTargetSpeed, 'value'),
      speedTargetValueType: strAttr(
        relativeTargetSpeed,
        'speedTargetValueType',
        'delta',
      ) as 'delta' | 'factor',
      continuous: boolAttr(relativeTargetSpeed, 'continuous'),
    };
  }

  throw new Error(`Unknown SpeedActionTarget type: ${rawKeys(raw).join(', ')}`);
}

function parseSpeedProfileAction(raw: RawXml): SpeedProfileAction {
  return {
    type: 'speedProfileAction',
    entityRef: optStrAttr(raw, 'entityRef'),
    followingMode: strAttr(raw, 'followingMode', 'follow') as FollowingMode,
    dynamicsDimension: optStrAttr(raw, 'dynamicsDimension') as DynamicsDimension | undefined,
    entries: children(raw, 'SpeedProfileEntry').map(parseSpeedProfileEntry),
  };
}

function parseSpeedProfileEntry(raw: RawXml): SpeedProfileEntry {
  return {
    speed: numAttr(raw, 'speed'),
    time: optNumAttr(raw, 'time'),
  };
}

function parseLongitudinalDistanceAction(raw: RawXml): LongitudinalDistanceAction {
  let dynamics: DynamicConstraints | undefined;
  const dynamicConstraints = child(raw, 'DynamicConstraints');
  if (dynamicConstraints) {
    pushBindingFieldPrefix('dynamics');
    dynamics = parseDynamicConstraints(dynamicConstraints);
    popBindingFieldPrefix();
  }

  return {
    type: 'longitudinalDistanceAction',
    entityRef: strAttr(raw, 'entityRef'),
    distance: optNumAttr(raw, 'distance'),
    timeGap: optNumAttr(raw, 'timeGap'),
    freespace: boolAttr(raw, 'freespace'),
    continuous: boolAttr(raw, 'continuous'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystem | undefined,
    displacement: optStrAttr(raw, 'displacement') as LongitudinalDisplacement | undefined,
    dynamics,
  };
}

// ---------------------------------------------------------------------------
// Lateral actions
// ---------------------------------------------------------------------------

function parseLateralAction(raw: RawXml): PrivateAction {
  const laneChangeAction = child(raw, 'LaneChangeAction');
  if (laneChangeAction) {
    return parseLaneChangeAction(laneChangeAction);
  }
  const laneOffsetAction = child(raw, 'LaneOffsetAction');
  if (laneOffsetAction) {
    return parseLaneOffsetAction(laneOffsetAction);
  }
  const lateralDistanceAction = child(raw, 'LateralDistanceAction');
  if (lateralDistanceAction) {
    return parseLateralDistanceAction(lateralDistanceAction);
  }

  throw new Error(`Unknown LateralAction type: ${rawKeys(raw).join(', ')}`);
}

function parseLaneChangeAction(raw: RawXml): LaneChangeAction {
  pushBindingFieldPrefix('dynamics');
  const dynamics = parseTransitionDynamics(child(raw, 'LaneChangeActionDynamics'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('target');
  const target = parseLaneChangeTarget(child(raw, 'LaneChangeTarget'));
  popBindingFieldPrefix();

  return {
    type: 'laneChangeAction',
    dynamics,
    target,
    targetLaneOffset: optNumAttr(raw, 'targetLaneOffset'),
  };
}

function parseLaneChangeTarget(raw: RawXml | undefined): LaneChangeTarget {
  if (!raw) throw new Error('LaneChangeTarget element is missing');

  const absoluteTargetLane = child(raw, 'AbsoluteTargetLane');
  if (absoluteTargetLane) {
    return {
      kind: 'absolute',
      value: numAttr(absoluteTargetLane, 'value'),
    };
  }
  const relativeTargetLane = child(raw, 'RelativeTargetLane');
  if (relativeTargetLane) {
    return {
      kind: 'relative',
      entityRef: strAttr(relativeTargetLane, 'entityRef'),
      value: numAttr(relativeTargetLane, 'value'),
    };
  }

  throw new Error(`Unknown LaneChangeTarget type: ${rawKeys(raw).join(', ')}`);
}

function parseLaneOffsetAction(raw: RawXml): LaneOffsetAction {
  pushBindingFieldPrefix('dynamics');
  const dynamics = parseLaneOffsetDynamics(child(raw, 'LaneOffsetActionDynamics'));
  popBindingFieldPrefix();

  pushBindingFieldPrefix('target');
  const target = parseLaneOffsetTarget(child(raw, 'LaneOffsetTarget'));
  popBindingFieldPrefix();

  return { type: 'laneOffsetAction', continuous: boolAttr(raw, 'continuous'), dynamics, target };
}

function parseLaneOffsetDynamics(raw: RawXml | undefined): LaneOffsetDynamics {
  if (!raw) return {};
  return {
    maxSpeed: optNumAttr(raw, 'maxSpeed'),
    maxLateralAcc: optNumAttr(raw, 'maxLateralAcc'),
    dynamicsShape: optStrAttr(raw, 'dynamicsShape') as DynamicsShape | undefined,
  };
}

function parseLaneOffsetTarget(raw: RawXml | undefined): LaneOffsetTarget {
  if (!raw) throw new Error('LaneOffsetTarget element is missing');

  const absoluteTargetLaneOffset = child(raw, 'AbsoluteTargetLaneOffset');
  if (absoluteTargetLaneOffset) {
    return {
      kind: 'absolute',
      value: numAttr(absoluteTargetLaneOffset, 'value'),
    };
  }
  const relativeTargetLaneOffset = child(raw, 'RelativeTargetLaneOffset');
  if (relativeTargetLaneOffset) {
    return {
      kind: 'relative',
      entityRef: strAttr(relativeTargetLaneOffset, 'entityRef'),
      value: numAttr(relativeTargetLaneOffset, 'value'),
    };
  }

  throw new Error(`Unknown LaneOffsetTarget type: ${rawKeys(raw).join(', ')}`);
}

function parseLateralDistanceAction(raw: RawXml): LateralDistanceAction {
  let dynamics: DynamicConstraints | undefined;
  const dynamicConstraints = child(raw, 'DynamicConstraints');
  if (dynamicConstraints) {
    pushBindingFieldPrefix('dynamics');
    dynamics = parseDynamicConstraints(dynamicConstraints);
    popBindingFieldPrefix();
  }

  return {
    type: 'lateralDistanceAction',
    entityRef: strAttr(raw, 'entityRef'),
    distance: optNumAttr(raw, 'distance'),
    freespace: boolAttr(raw, 'freespace'),
    continuous: boolAttr(raw, 'continuous'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystem | undefined,
    displacement: optStrAttr(raw, 'displacement') as LateralDisplacement | undefined,
    dynamics,
  };
}

function parseDynamicConstraints(raw: RawXml): DynamicConstraints {
  return {
    maxAcceleration: optNumAttr(raw, 'maxAcceleration'),
    maxDeceleration: optNumAttr(raw, 'maxDeceleration'),
    maxSpeed: optNumAttr(raw, 'maxSpeed'),
  };
}

// ---------------------------------------------------------------------------
// Teleport action
// ---------------------------------------------------------------------------

function parseTeleportAction(raw: RawXml): TeleportAction {
  pushBindingFieldPrefix('position');
  const position = parsePosition(child(raw, 'Position'));
  popBindingFieldPrefix();
  return { type: 'teleportAction', position };
}

// ---------------------------------------------------------------------------
// Synchronize action
// ---------------------------------------------------------------------------

function parseSynchronizeAction(raw: RawXml): SynchronizeAction {
  const finalSpeed = child(raw, 'FinalSpeed');
  return {
    type: 'synchronizeAction',
    masterEntityRef: strAttr(raw, 'masterEntityRef'),
    // TargetPositionMaster/TargetPosition contain position elements DIRECTLY
    // (e.g. <LanePosition>), not wrapped in <Position>
    targetPositionMaster: parsePosition(child(raw, 'TargetPositionMaster')),
    targetPosition: parsePosition(child(raw, 'TargetPosition')),
    finalSpeed: finalSpeed ? parseFinalSpeed(finalSpeed) : undefined,
    toleranceMaster: optNumAttr(raw, 'toleranceMaster'),
    tolerance: optNumAttr(raw, 'tolerance'),
  };
}

function parseFinalSpeed(raw: RawXml): FinalSpeed {
  const result: FinalSpeed = {};

  const absoluteSpeed = child(raw, 'AbsoluteSpeed');
  if (absoluteSpeed) {
    result.absoluteSpeed = {
      value: numAttr(absoluteSpeed, 'value'),
      steadyState: optBoolAttr(absoluteSpeed, 'steadyState'),
    };
  }
  const relativeSpeedToMaster = child(raw, 'RelativeSpeedToMaster');
  if (relativeSpeedToMaster) {
    result.relativeSpeedToMaster = {
      value: numAttr(relativeSpeedToMaster, 'value'),
      speedTargetValueType: strAttr(
        relativeSpeedToMaster,
        'speedTargetValueType',
        'delta',
      ) as 'delta' | 'factor',
      steadyState: optBoolAttr(relativeSpeedToMaster, 'steadyState'),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Controller actions
// ---------------------------------------------------------------------------

function parseControllerAction(raw: RawXml): PrivateAction {
  const assignControllerAction = child(raw, 'AssignControllerAction');
  if (assignControllerAction) {
    return parseAssignControllerAction(assignControllerAction);
  }
  const activateControllerAction = child(raw, 'ActivateControllerAction');
  if (activateControllerAction) {
    return parseActivateControllerAction(activateControllerAction);
  }
  const overrideControllerValueAction = child(raw, 'OverrideControllerValueAction');
  if (overrideControllerValueAction) {
    return parseOverrideControllerAction(overrideControllerValueAction);
  }

  throw new Error(`Unknown ControllerAction type: ${rawKeys(raw).join(', ')}`);
}

function parseAssignControllerAction(raw: RawXml): AssignControllerAction {
  const result: AssignControllerAction = {
    type: 'assignControllerAction',
    activateLateral: optBoolAttr(raw, 'activateLateral'),
    activateLongitudinal: optBoolAttr(raw, 'activateLongitudinal'),
    activateAnimation: optBoolAttr(raw, 'activateAnimation'),
    activateLighting: optBoolAttr(raw, 'activateLighting'),
  };

  const controller = child(raw, 'Controller');
  if (controller) {
    const properties = child(controller, 'Properties');
    result.controller = {
      name: strAttr(controller, 'name'),
      properties: properties ? children(properties, 'Property').map(parseProperty) : [],
    };
  }

  const catalogReference = child(raw, 'CatalogReference');
  if (catalogReference) {
    result.catalogReference = {
      catalogName: strAttr(catalogReference, 'catalogName'),
      entryName: strAttr(catalogReference, 'entryName'),
    };
  }

  return result;
}

function parseProperty(raw: RawXml): Property {
  return {
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
  };
}

function parseActivateControllerAction(raw: RawXml): ActivateControllerAction {
  return {
    type: 'activateControllerAction',
    lateral: optBoolAttr(raw, 'lateral'),
    longitudinal: optBoolAttr(raw, 'longitudinal'),
    animation: optBoolAttr(raw, 'animation'),
    lighting: optBoolAttr(raw, 'lighting'),
    controllerRef: optStrAttr(raw, 'controllerRef'),
  };
}

function parseOverrideControllerAction(raw: RawXml): OverrideControllerAction {
  const throttle = child(raw, 'Throttle');
  const brake = child(raw, 'Brake');
  const clutch = child(raw, 'Clutch');
  const parkingBrake = child(raw, 'ParkingBrake');
  const steeringWheel = child(raw, 'SteeringWheel');
  const gear = child(raw, 'Gear');
  return {
    type: 'overrideControllerAction',
    throttle: throttle ? parseOverrideValue(throttle) : undefined,
    brake: brake ? parseOverrideValue(brake) : undefined,
    clutch: clutch ? parseOverrideValue(clutch) : undefined,
    parkingBrake: parkingBrake ? parseOverrideValue(parkingBrake) : undefined,
    steeringWheel: steeringWheel ? parseOverrideValue(steeringWheel) : undefined,
    gear: gear ? parseOverrideGearValue(gear) : undefined,
  };
}

function parseOverrideValue(raw: RawXml): OverrideValue {
  return {
    value: numAttr(raw, 'value'),
    active: boolAttr(raw, 'active'),
    maxRate: optNumAttr(raw, 'maxRate'),
    maxTorque: optNumAttr(raw, 'maxTorque'),
  };
}

function parseOverrideGearValue(raw: RawXml): OverrideGearValue {
  return {
    number: optNumAttr(raw, 'number'),
    active: boolAttr(raw, 'active'),
  };
}

// ---------------------------------------------------------------------------
// Routing actions
// ---------------------------------------------------------------------------

function parseRoutingAction(raw: RawXml): PrivateAction {
  const assignRouteAction = child(raw, 'AssignRouteAction');
  if (assignRouteAction) {
    return parseAssignRouteAction(assignRouteAction);
  }
  const acquirePositionAction = child(raw, 'AcquirePositionAction');
  if (acquirePositionAction) {
    // AcquirePositionAction under RoutingAction maps to RoutingAction type
    return parseRoutingAcquirePositionAction(acquirePositionAction);
  }
  const followTrajectoryAction = child(raw, 'FollowTrajectoryAction');
  if (followTrajectoryAction) {
    return parseFollowTrajectoryAction(followTrajectoryAction);
  }
  if (has(raw, 'RandomRouteAction')) {
    // XSD RandomRouteAction is an empty element; preserve it as a typed
    // passthrough so it survives a round-trip without throwing.
    return { type: 'routingAction', routeAction: 'randomRoute' };
  }

  throw new Error(`Unknown RoutingAction type: ${rawKeys(raw).join(', ')}`);
}

function parseAssignRouteAction(raw: RawXml): RoutingAction {
  const result: RoutingAction = {
    type: 'routingAction',
    routeAction: 'assignRoute',
  };

  const route = child(raw, 'Route');
  const catalogReference = child(raw, 'CatalogReference');
  if (route) {
    result.route = {
      name: strAttr(route, 'name'),
      closed: boolAttr(route, 'closed'),
      waypoints: children(route, 'Waypoint').map(parseRouteWaypoint),
    };
  } else if (catalogReference) {
    result.catalogReference = {
      catalogName: strAttr(catalogReference, 'catalogName'),
      entryName: strAttr(catalogReference, 'entryName'),
    };
  }

  return result;
}

function parseRouteWaypoint(raw: RawXml): {
  position: ReturnType<typeof parsePosition>;
  routeStrategy: RouteStrategy;
} {
  return {
    position: parsePosition(child(raw, 'Position')),
    routeStrategy: strAttr(raw, 'routeStrategy', 'shortest') as RouteStrategy,
  };
}

function parseRoutingAcquirePositionAction(raw: RawXml): RoutingAction {
  return {
    type: 'routingAction',
    routeAction: 'acquirePosition',
    position: parsePosition(child(raw, 'Position')),
  };
}

function parseFollowTrajectoryAction(raw: RawXml): FollowTrajectoryAction {
  // XSD FollowTrajectoryAction choice (via TrajectoryRef → Trajectory |
  // CatalogReference), plus deprecated inline Trajectory / CatalogReference
  // directly under the action.
  const result: FollowTrajectoryAction = {
    type: 'followTrajectoryAction',
    timeReference: parseTimeReference(child(raw, 'TimeReference')),
    followingMode: strAttr(
      child(raw, 'TrajectoryFollowingMode'),
      'followingMode',
      'follow',
    ) as FollowingMode,
    initialDistanceOffset: optNumAttr(raw, 'initialDistanceOffset'),
  };

  const trajectoryRef = child(raw, 'TrajectoryRef');
  const inlineTrajectory = child(raw, 'Trajectory') ?? child(trajectoryRef, 'Trajectory');
  const catalogReference = child(raw, 'CatalogReference') ?? child(trajectoryRef, 'CatalogReference');

  if (inlineTrajectory) {
    result.trajectory = parseTrajectory(inlineTrajectory);
  } else if (catalogReference) {
    result.trajectoryRef = {
      catalogName: strAttr(catalogReference, 'catalogName'),
      entryName: strAttr(catalogReference, 'entryName'),
    };
  }

  return result;
}

export function parseTrajectory(raw: RawXml | undefined): Trajectory {
  if (!raw) throw new Error('Trajectory element is missing');
  return {
    name: strAttr(raw, 'name'),
    closed: boolAttr(raw, 'closed'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    shape: parseTrajectoryShape(child(raw, 'Shape')),
  };
}

function parseTrajectoryShape(raw: RawXml | undefined): TrajectoryShape {
  if (!raw) throw new Error('Shape element is missing in Trajectory');

  // `Polyline` may parse as '' or {} when it has no Vertex children
  // (fast-xml-parser collapses empty elements), so check with `has`.
  if (has(raw, 'Polyline')) {
    const polyline = child(raw, 'Polyline');
    return {
      type: 'polyline',
      vertices: polyline ? children(polyline, 'Vertex').map(parseTrajectoryVertex) : [],
    };
  }
  const clothoid = child(raw, 'Clothoid');
  if (clothoid) {
    const position = child(clothoid, 'Position');
    return {
      type: 'clothoid',
      curvature: numAttr(clothoid, 'curvature'),
      curvatureDot: numAttr(clothoid, 'curvatureDot'),
      length: numAttr(clothoid, 'length'),
      startTime: optNumAttr(clothoid, 'startTime'),
      stopTime: optNumAttr(clothoid, 'stopTime'),
      position: position ? parsePosition(position) : undefined,
    };
  }
  const clothoidSpline = child(raw, 'ClothoidSpline');
  if (clothoidSpline) {
    return {
      type: 'clothoidSpline',
      segments: children(clothoidSpline, 'ClothoidSplineSegment').map(parseClothoidSplineSegment),
      timeEnd: optNumAttr(clothoidSpline, 'timeEnd'),
    };
  }
  const nurbs = child(raw, 'Nurbs');
  if (nurbs) {
    return {
      type: 'nurbs',
      order: numAttr(nurbs, 'order'),
      controlPoints: children(nurbs, 'ControlPoint').map(parseNurbsControlPoint),
      knots: children(nurbs, 'Knot').map((k) => numAttr(k, 'value')),
    };
  }

  throw new Error(`Unknown TrajectoryShape type: ${rawKeys(raw).join(', ')}`);
}

function parseClothoidSplineSegment(raw: RawXml): ClothoidSplineSegment {
  const positionStart = child(raw, 'PositionStart');
  return {
    curvatureStart: numAttr(raw, 'curvatureStart'),
    curvatureEnd: numAttr(raw, 'curvatureEnd'),
    length: numAttr(raw, 'length'),
    hOffset: optNumAttr(raw, 'hOffset'),
    timeStart: optNumAttr(raw, 'timeStart'),
    positionStart: positionStart ? parsePosition(positionStart) : undefined,
  };
}

function parseTrajectoryVertex(raw: RawXml): TrajectoryVertex {
  return {
    position: parsePosition(child(raw, 'Position')),
    time: optNumAttr(raw, 'time'),
  };
}

function parseNurbsControlPoint(raw: RawXml): NurbsControlPoint {
  return {
    position: parsePosition(child(raw, 'Position')),
    time: optNumAttr(raw, 'time'),
    weight: optNumAttr(raw, 'weight'),
  };
}

function parseTimeReference(raw: RawXml | undefined): TimeReference {
  if (!raw) return { none: true };

  if (has(raw, 'None')) {
    return { none: true };
  }
  const timing = child(raw, 'Timing');
  if (timing) {
    return {
      timing: {
        domainAbsoluteRelative: strAttr(
          timing,
          'domainAbsoluteRelative',
          'absolute',
        ) as 'absolute' | 'relative',
        offset: numAttr(timing, 'offset'),
        scale: numAttr(timing, 'scale', 1),
      },
    };
  }

  return { none: true };
}

// ---------------------------------------------------------------------------
// Visibility action
// ---------------------------------------------------------------------------

function parseVisibilityAction(raw: RawXml): VisibilityAction {
  return {
    type: 'visibilityAction',
    graphics: boolAttr(raw, 'graphics'),
    traffic: boolAttr(raw, 'traffic'),
    sensors: boolAttr(raw, 'sensors'),
    entityRef: optStrAttr(raw, 'entityRef'),
  };
}

// ---------------------------------------------------------------------------
// Appearance action
// ---------------------------------------------------------------------------

function parseAppearanceAction(raw: RawXml): AppearanceAction {
  // AppearanceAction is a placeholder with [key: string]: unknown
  const result: AppearanceAction = { type: 'appearanceAction' };
  for (const key of Object.keys(raw)) {
    if (!key.startsWith('@_')) {
      result[key] = raw[key];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Animation action
// ---------------------------------------------------------------------------

function parseAnimationAction(raw: RawXml): AnimationAction {
  // XSD AnimationAction: sequence(AnimationType, AnimationState?) with
  // `loop` / `animationDuration` attributes.
  const animationTypeEl = child(raw, 'AnimationType');
  const animationType = animationTypeEl
    ? parseAnimationType(animationTypeEl)
    : strAttr(raw, 'animationType', '');

  const animationState = child(raw, 'AnimationState');
  return {
    type: 'animationAction',
    animationType,
    state: animationState ? optStrAttr(animationState, 'state') : undefined,
    duration: optNumAttr(raw, 'animationDuration'),
    loop: optBoolAttr(raw, 'loop'),
  };
}

function parseAnimationType(raw: RawXml): string {
  // XSD AnimationType: choice(ComponentAnimation | PedestrianAnimation |
  // AnimationFile | UserDefinedAnimation). UserDefinedAnimation is what the
  // serializer emits; the others are read tolerantly for external inputs.
  const userDefinedAnimation = child(raw, 'UserDefinedAnimation');
  if (userDefinedAnimation) {
    return strAttr(userDefinedAnimation, 'userDefinedAnimationType', '') ||
      strAttr(userDefinedAnimation, 'type', '');
  }
  const componentAnimation = child(raw, 'ComponentAnimation');
  if (componentAnimation) {
    return strAttr(child(componentAnimation, 'VehicleComponent'), 'vehicleComponentType', '') ||
      strAttr(child(componentAnimation, 'UserDefinedComponent'), 'userDefinedComponentType', '');
  }
  const pedestrianAnimation = child(raw, 'PedestrianAnimation');
  if (pedestrianAnimation) {
    // Could be motion or gesture
    return strAttr(pedestrianAnimation, 'motion', '') ||
      strAttr(pedestrianAnimation, 'gesture', '');
  }
  const animationFile = child(raw, 'AnimationFile');
  if (animationFile) {
    return strAttr(child(animationFile, 'File'), 'filepath', '') ||
      strAttr(animationFile, 'file', '');
  }
  return '';
}

// ---------------------------------------------------------------------------
// Light state action
// ---------------------------------------------------------------------------

function parseLightStateAction(raw: RawXml): LightStateAction {
  const lightState = child(raw, 'LightState');
  const lightType = child(raw, 'LightType');

  const result: LightStateAction = {
    type: 'lightStateAction',
    lightType: parseLightType(lightType),
    mode: strAttr(lightState, 'mode', 'off') as LightMode,
    // XSD LightState intensity is the `luminousIntensity` attribute (read the
    // legacy `intensity` attribute too for tolerance).
    intensity: optNumAttr(lightState, 'luminousIntensity') ?? optNumAttr(lightState, 'intensity'),
    transitionTime: optNumAttr(raw, 'transitionTime'),
  };

  const color = child(lightState, 'Color');
  if (color) {
    const colorRgb = child(color, 'ColorRgb') ?? color;
    result.color = {
      r: numAttr(colorRgb, 'red', 0),
      g: numAttr(colorRgb, 'green', 0),
      b: numAttr(colorRgb, 'blue', 0),
    };
  }

  return result;
}

function parseLightType(raw: RawXml | undefined): string {
  if (!raw) return '';
  // XSD-compliant: <VehicleLight vehicleLightType="..."/>
  const vehicleLight = child(raw, 'VehicleLight');
  if (vehicleLight) {
    const vlt = strAttr(vehicleLight, 'vehicleLightType', '');
    return vlt ? `vehicleLight:${vlt}` : '';
  }
  // Legacy: <VehicleLightType vehicleLightType="..."/>
  const vehicleLightTypeRaw = raw.VehicleLightType;
  if (vehicleLightTypeRaw) {
    const vlt = strAttr(child(raw, 'VehicleLightType'), 'vehicleLightType', '') ||
      (typeof vehicleLightTypeRaw === 'string' ? vehicleLightTypeRaw : '');
    return vlt ? `vehicleLight:${vlt}` : '';
  }
  // XSD-compliant: <UserDefinedLight userDefinedLightType="..."/>
  const userDefinedLight = child(raw, 'UserDefinedLight');
  if (userDefinedLight) {
    const udt = strAttr(userDefinedLight, 'userDefinedLightType', '');
    return udt ? `userDefined:${udt}` : '';
  }
  // Legacy: <UserDefinedLightType type="..."/>
  const userDefinedLightType = child(raw, 'UserDefinedLightType');
  if (userDefinedLightType) {
    const udt = strAttr(userDefinedLightType, 'type', '');
    return udt ? `userDefined:${udt}` : '';
  }
  // Fallback: old format <LightType value="vehicleLight:..."/>
  const value = strAttr(raw, 'value', '');
  if (value) return value;
  return '';
}

// ---------------------------------------------------------------------------
// Trailer actions
// ---------------------------------------------------------------------------

function parseConnectTrailerAction(raw: RawXml): ConnectTrailerAction {
  return {
    type: 'connectTrailerAction',
    trailerRef: strAttr(raw, 'trailerRef', '') || strAttr(child(raw, 'TrailerRef'), 'entityRef', ''),
  };
}

function parseDisconnectTrailerAction(): DisconnectTrailerAction {
  return {
    type: 'disconnectTrailerAction',
  };
}

// ---------------------------------------------------------------------------
// Global actions
// ---------------------------------------------------------------------------

function parseEnvironmentAction(raw: RawXml): EnvironmentAction {
  // XSD EnvironmentAction: choice(Environment | CatalogReference).
  const catalogReference = child(raw, 'CatalogReference');
  if (catalogReference) {
    return {
      type: 'environmentAction',
      catalogReference: {
        catalogName: strAttr(catalogReference, 'catalogName'),
        entryName: strAttr(catalogReference, 'entryName'),
      },
    };
  }
  return {
    type: 'environmentAction',
    environment: parseEnvironment(child(raw, 'Environment')),
  };
}

export function parseEnvironment(raw: RawXml | undefined): Environment {
  if (!raw) throw new Error('Environment element is missing');
  return {
    name: strAttr(raw, 'name'),
    parameterDeclarations: parseParameterDeclarations(child(raw, 'ParameterDeclarations')),
    timeOfDay: parseTimeOfDay(child(raw, 'TimeOfDay')),
    weather: parseWeather(child(raw, 'Weather')),
    roadCondition: parseRoadCondition(child(raw, 'RoadCondition')),
  };
}

function parseTimeOfDay(raw: RawXml | undefined): TimeOfDay {
  if (!raw) return { animation: false, dateTime: '' };
  return {
    animation: boolAttr(raw, 'animation'),
    dateTime: strAttr(raw, 'dateTime'),
  };
}

function parseWeather(raw: RawXml | undefined): Weather {
  if (!raw) return {};
  const result: Weather = {
    fractionalCloudCover: optStrAttr(raw, 'fractionalCloudCover') as
      | FractionalCloudCover
      | undefined,
    atmosphericPressure: optNumAttr(raw, 'atmosphericPressure'),
    temperature: optNumAttr(raw, 'temperature'),
  };

  const sun = child(raw, 'Sun');
  if (sun) {
    result.sun = {
      intensity: numAttr(sun, 'intensity'),
      azimuth: numAttr(sun, 'azimuth'),
      elevation: numAttr(sun, 'elevation'),
    };
  }

  const fog = child(raw, 'Fog');
  if (fog) {
    const boundingBox = child(fog, 'BoundingBox');
    const center = child(boundingBox, 'Center');
    const dimensions = child(boundingBox, 'Dimensions');
    result.fog = {
      visualRange: numAttr(fog, 'visualRange'),
      boundingBox: boundingBox
        ? {
            center: {
              x: numAttr(center, 'x'),
              y: numAttr(center, 'y'),
              z: numAttr(center, 'z'),
            },
            dimensions: {
              width: numAttr(dimensions, 'width'),
              length: numAttr(dimensions, 'length'),
              height: numAttr(dimensions, 'height'),
            },
          }
        : undefined,
    };
  }

  const precipitation = child(raw, 'Precipitation');
  if (precipitation) {
    result.precipitation = {
      precipitationType: strAttr(precipitation, 'precipitationType', 'dry') as PrecipitationType,
      precipitationIntensity: numAttr(precipitation, 'precipitationIntensity'),
    };
  }

  const wind = child(raw, 'Wind');
  if (wind) {
    result.wind = {
      direction: numAttr(wind, 'direction'),
      speed: numAttr(wind, 'speed'),
    };
  }

  return result;
}

function parseRoadCondition(raw: RawXml | undefined): RoadCondition {
  if (!raw) return { frictionScaleFactor: 1.0 };
  return {
    frictionScaleFactor: numAttr(raw, 'frictionScaleFactor', 1.0),
    wetness: optStrAttr(raw, 'wetness') as Wetness | undefined,
  };
}

function parseEntityAction(raw: RawXml): EntityAction {
  const entityRef = strAttr(raw, 'entityRef');

  const addEntityAction = child(raw, 'AddEntityAction');
  if (addEntityAction) {
    const position = child(addEntityAction, 'Position');
    return {
      type: 'entityAction',
      entityRef,
      actionType: 'addEntity',
      position: position ? parsePosition(position) : undefined,
    };
  }
  if (has(raw, 'DeleteEntityAction')) {
    return {
      type: 'entityAction',
      entityRef,
      actionType: 'deleteEntity',
    };
  }

  throw new Error(`Unknown EntityAction type: ${rawKeys(raw).join(', ')}`);
}

function parseParameterAction(raw: RawXml): ParameterAction {
  const parameterRef = strAttr(raw, 'parameterRef');

  const setAction = child(raw, 'SetAction');
  if (setAction) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'set',
      value: strAttr(setAction, 'value'),
    };
  }
  const modifyAction = child(raw, 'ModifyAction');
  if (modifyAction) {
    return parseParameterModifyAction(modifyAction, parameterRef);
  }

  throw new Error(`Unknown ParameterAction type: ${rawKeys(raw).join(', ')}`);
}

function parseParameterModifyAction(raw: RawXml, parameterRef: string): ParameterAction {
  const rule = child(raw, 'Rule');
  if (!rule) throw new Error('ModifyAction missing Rule element');

  const addValue = child(rule, 'AddValue');
  if (addValue) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: numAttr(addValue, 'value'),
    };
  }
  const multiplyByValue = child(rule, 'MultiplyByValue');
  if (multiplyByValue) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: numAttr(multiplyByValue, 'value'),
    };
  }

  throw new Error(`Unknown ParameterAction ModifyAction Rule type: ${rawKeys(rule).join(', ')}`);
}

function parseVariableAction(raw: RawXml): VariableAction {
  const variableRef = strAttr(raw, 'variableRef');

  const setAction = child(raw, 'SetAction');
  if (setAction) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'set',
      value: strAttr(setAction, 'value'),
    };
  }
  const modifyAction = child(raw, 'ModifyAction');
  if (modifyAction) {
    return parseVariableModifyAction(modifyAction, variableRef);
  }

  throw new Error(`Unknown VariableAction type: ${rawKeys(raw).join(', ')}`);
}

function parseVariableModifyAction(raw: RawXml, variableRef: string): VariableAction {
  const rule = child(raw, 'Rule');
  if (!rule) throw new Error('ModifyAction missing Rule element');

  const addValue = child(rule, 'AddValue');
  if (addValue) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: numAttr(addValue, 'value'),
    };
  }
  const multiplyByValue = child(rule, 'MultiplyByValue');
  if (multiplyByValue) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: numAttr(multiplyByValue, 'value'),
    };
  }

  throw new Error(`Unknown VariableAction ModifyAction Rule type: ${rawKeys(rule).join(', ')}`);
}

function parseInfrastructureAction(raw: RawXml): InfrastructureAction {
  return {
    type: 'infrastructureAction',
    trafficSignalAction: parseTrafficSignalAction(child(raw, 'TrafficSignalAction')),
  };
}

function parseTrafficSignalAction(raw: RawXml | undefined): TrafficSignalAction {
  if (!raw) throw new Error('TrafficSignalAction element is missing');

  const result: TrafficSignalAction = {};

  const ctrl = child(raw, 'TrafficSignalControllerAction');
  if (ctrl) {
    result.controllerRef = strAttr(ctrl, 'trafficSignalControllerRef');
    const phase = optStrAttr(ctrl, 'phase');
    if (phase) {
      result.controllerAction = { phase };
    }
  }

  const stateAction = child(raw, 'TrafficSignalStateAction');
  if (stateAction) {
    result.stateAction = {
      name: strAttr(stateAction, 'name'),
      state: strAttr(stateAction, 'state'),
    };
  }

  return result;
}

function parseTrafficAction(raw: RawXml): TrafficAction {
  // TrafficAction is a placeholder with [key: string]: unknown. Its child
  // elements (TrafficSource/Sink/Swarm/Area/Stop) are copied verbatim so they
  // survive a round-trip; TrafficAreaAction (v1.3) rides this passthrough.
  const result: TrafficAction = { type: 'trafficAction' };
  for (const key of Object.keys(raw)) {
    if (!key.startsWith('@_')) {
      result[key] = raw[key];
    }
  }
  return result;
}

function parseSetMonitorAction(raw: RawXml): SetMonitorAction {
  // XSD SetMonitorAction (v1.3): monitorRef + value, both required.
  return {
    type: 'setMonitorAction',
    monitorRef: strAttr(raw, 'monitorRef'),
    value: boolAttr(raw, 'value'),
  };
}
