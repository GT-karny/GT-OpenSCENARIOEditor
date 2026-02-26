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
} from '@osce/shared';
import { parsePosition } from './parse-positions.js';
import { ensureArray } from '../utils/ensure-array.js';
import {
  numAttr,
  strAttr,
  optNumAttr,
  optStrAttr,
  boolAttr,
  optBoolAttr,
} from '../utils/xml-helpers.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a PrivateAction XML element into the internal discriminated union.
 * Handles the intermediate wrapping elements (LongitudinalAction, LateralAction, etc.)
 * and maps them to flat action types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePrivateAction(raw: any): PrivateAction {
  if (!raw) throw new Error('PrivateAction element is missing');

  // --- Longitudinal actions ---
  if (raw.LongitudinalAction) {
    return parseLongitudinalAction(raw.LongitudinalAction);
  }

  // --- Lateral actions ---
  if (raw.LateralAction) {
    return parseLateralAction(raw.LateralAction);
  }

  // --- Teleport ---
  if (raw.TeleportAction) {
    return parseTeleportAction(raw.TeleportAction);
  }

  // --- Synchronize ---
  if (raw.SynchronizeAction) {
    return parseSynchronizeAction(raw.SynchronizeAction);
  }

  // --- Controller actions (wraps Assign/Activate/Override) ---
  if (raw.ControllerAction) {
    return parseControllerAction(raw.ControllerAction);
  }

  // --- Routing actions ---
  if (raw.RoutingAction) {
    return parseRoutingAction(raw.RoutingAction);
  }

  // --- Visibility ---
  if (raw.VisibilityAction) {
    return parseVisibilityAction(raw.VisibilityAction);
  }

  // --- Appearance ---
  if (raw.AppearanceAction) {
    return parseAppearanceAction(raw.AppearanceAction);
  }

  // --- Animation ---
  if (raw.AnimationAction) {
    return parseAnimationAction(raw.AnimationAction);
  }

  // --- Light state ---
  if (raw.LightStateAction) {
    return parseLightStateAction(raw.LightStateAction);
  }

  // --- Trailer actions ---
  if (raw.TrailerAction) {
    // TrailerAction wraps Connect/DisconnectTrailerAction
    const ta = raw.TrailerAction;
    if (ta.ConnectTrailerAction) {
      return parseConnectTrailerAction(ta.ConnectTrailerAction);
    }
    if ('DisconnectTrailerAction' in ta) {
      return parseDisconnectTrailerAction();
    }
  }
  if (raw.ConnectTrailerAction) {
    return parseConnectTrailerAction(raw.ConnectTrailerAction);
  }
  if ('DisconnectTrailerAction' in raw) {
    return parseDisconnectTrailerAction();
  }

  // --- Direct controller actions (esmini / v1.0 style, without ControllerAction wrapper) ---
  if (raw.ActivateControllerAction) {
    return parseActivateControllerAction(raw.ActivateControllerAction);
  }
  if (raw.AssignControllerAction) {
    return parseAssignControllerAction(raw.AssignControllerAction);
  }
  if (raw.OverrideControllerValueAction) {
    return parseOverrideControllerAction(raw.OverrideControllerValueAction);
  }

  // --- FollowTrajectoryAction directly under PrivateAction (some files) ---
  if (raw.FollowTrajectoryAction) {
    return parseFollowTrajectoryAction(raw.FollowTrajectoryAction);
  }

  // --- AcquirePositionAction directly under PrivateAction (some files) ---
  if (raw.AcquirePositionAction) {
    return parseRoutingAcquirePositionAction(raw.AcquirePositionAction);
  }

  throw new Error(
    `Unknown PrivateAction type: ${Object.keys(raw).join(', ')}`,
  );
}

/**
 * Parses a GlobalAction XML element into the internal discriminated union.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGlobalAction(raw: any): GlobalAction {
  if (!raw) throw new Error('GlobalAction element is missing');

  if (raw.EnvironmentAction) {
    return parseEnvironmentAction(raw.EnvironmentAction);
  }
  if (raw.EntityAction) {
    return parseEntityAction(raw.EntityAction);
  }
  if (raw.ParameterAction) {
    return parseParameterAction(raw.ParameterAction);
  }
  if (raw.VariableAction) {
    return parseVariableAction(raw.VariableAction);
  }
  if (raw.InfrastructureAction) {
    return parseInfrastructureAction(raw.InfrastructureAction);
  }
  if (raw.TrafficAction) {
    return parseTrafficAction(raw.TrafficAction);
  }

  throw new Error(
    `Unknown GlobalAction type: ${Object.keys(raw).join(', ')}`,
  );
}

/**
 * Parses a UserDefinedAction XML element.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseUserDefinedAction(raw: any): UserDefinedAction {
  if (!raw) throw new Error('UserDefinedAction element is missing');
  return {
    type: 'userDefinedAction',
    customCommandAction: strAttr(raw.CustomCommandAction, 'type', ''),
  };
}

// ---------------------------------------------------------------------------
// Longitudinal actions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLongitudinalAction(raw: any): PrivateAction {
  if (raw.SpeedAction) {
    return parseSpeedAction(raw.SpeedAction);
  }
  if (raw.SpeedProfileAction) {
    return parseSpeedProfileAction(raw.SpeedProfileAction);
  }
  if (raw.LongitudinalDistanceAction) {
    return parseLongitudinalDistanceAction(raw.LongitudinalDistanceAction);
  }

  throw new Error(
    `Unknown LongitudinalAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpeedAction(raw: any): SpeedAction {
  return {
    type: 'speedAction',
    dynamics: parseTransitionDynamics(raw.SpeedActionDynamics),
    target: parseSpeedTarget(raw.SpeedActionTarget),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTransitionDynamics(raw: any): TransitionDynamics {
  return {
    dynamicsShape: strAttr(raw, 'dynamicsShape', 'linear') as DynamicsShape,
    dynamicsDimension: strAttr(raw, 'dynamicsDimension', 'rate') as DynamicsDimension,
    value: numAttr(raw, 'value'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpeedTarget(raw: any): SpeedTarget {
  if (!raw) throw new Error('SpeedActionTarget element is missing');

  if (raw.AbsoluteTargetSpeed) {
    return {
      kind: 'absolute',
      value: numAttr(raw.AbsoluteTargetSpeed, 'value'),
    };
  }
  if (raw.RelativeTargetSpeed) {
    return {
      kind: 'relative',
      entityRef: strAttr(raw.RelativeTargetSpeed, 'entityRef'),
      value: numAttr(raw.RelativeTargetSpeed, 'value'),
      speedTargetValueType: strAttr(
        raw.RelativeTargetSpeed,
        'speedTargetValueType',
        'delta',
      ) as 'delta' | 'factor',
      continuous: boolAttr(raw.RelativeTargetSpeed, 'continuous'),
    };
  }

  throw new Error(
    `Unknown SpeedActionTarget type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpeedProfileAction(raw: any): SpeedProfileAction {
  return {
    type: 'speedProfileAction',
    entityRef: optStrAttr(raw, 'entityRef'),
    followingMode: strAttr(raw, 'followingMode', 'follow') as FollowingMode,
    dynamicsDimension: optStrAttr(raw, 'dynamicsDimension') as DynamicsDimension | undefined,
    entries: ensureArray(raw.SpeedProfileEntry).map(parseSpeedProfileEntry),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpeedProfileEntry(raw: any): SpeedProfileEntry {
  return {
    speed: numAttr(raw, 'speed'),
    time: optNumAttr(raw, 'time'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLongitudinalDistanceAction(raw: any): LongitudinalDistanceAction {
  return {
    type: 'longitudinalDistanceAction',
    entityRef: strAttr(raw, 'entityRef'),
    distance: optNumAttr(raw, 'distance'),
    timeGap: optNumAttr(raw, 'timeGap'),
    freespace: boolAttr(raw, 'freespace'),
    continuous: boolAttr(raw, 'continuous'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystem | undefined,
    displacement: optStrAttr(raw, 'displacement') as LongitudinalDisplacement | undefined,
    dynamics: raw.DynamicConstraints
      ? parseDynamicConstraints(raw.DynamicConstraints)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Lateral actions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLateralAction(raw: any): PrivateAction {
  if (raw.LaneChangeAction) {
    return parseLaneChangeAction(raw.LaneChangeAction);
  }
  if (raw.LaneOffsetAction) {
    return parseLaneOffsetAction(raw.LaneOffsetAction);
  }
  if (raw.LateralDistanceAction) {
    return parseLateralDistanceAction(raw.LateralDistanceAction);
  }

  throw new Error(
    `Unknown LateralAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLaneChangeAction(raw: any): LaneChangeAction {
  return {
    type: 'laneChangeAction',
    dynamics: parseTransitionDynamics(raw.LaneChangeActionDynamics),
    target: parseLaneChangeTarget(raw.LaneChangeTarget),
    targetLaneOffset: optNumAttr(raw, 'targetLaneOffset'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLaneChangeTarget(raw: any): LaneChangeTarget {
  if (!raw) throw new Error('LaneChangeTarget element is missing');

  if (raw.AbsoluteTargetLane) {
    return {
      kind: 'absolute',
      value: numAttr(raw.AbsoluteTargetLane, 'value'),
    };
  }
  if (raw.RelativeTargetLane) {
    return {
      kind: 'relative',
      entityRef: strAttr(raw.RelativeTargetLane, 'entityRef'),
      value: numAttr(raw.RelativeTargetLane, 'value'),
    };
  }

  throw new Error(
    `Unknown LaneChangeTarget type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLaneOffsetAction(raw: any): LaneOffsetAction {
  return {
    type: 'laneOffsetAction',
    continuous: boolAttr(raw, 'continuous'),
    dynamics: parseLaneOffsetDynamics(raw.LaneOffsetActionDynamics),
    target: parseLaneOffsetTarget(raw.LaneOffsetTarget),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLaneOffsetDynamics(raw: any): LaneOffsetDynamics {
  if (!raw) return {};
  return {
    maxSpeed: optNumAttr(raw, 'maxSpeed'),
    maxLateralAcc: optNumAttr(raw, 'maxLateralAcc'),
    dynamicsShape: optStrAttr(raw, 'dynamicsShape') as DynamicsShape | undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLaneOffsetTarget(raw: any): LaneOffsetTarget {
  if (!raw) throw new Error('LaneOffsetTarget element is missing');

  if (raw.AbsoluteTargetLaneOffset) {
    return {
      kind: 'absolute',
      value: numAttr(raw.AbsoluteTargetLaneOffset, 'value'),
    };
  }
  if (raw.RelativeTargetLaneOffset) {
    return {
      kind: 'relative',
      entityRef: strAttr(raw.RelativeTargetLaneOffset, 'entityRef'),
      value: numAttr(raw.RelativeTargetLaneOffset, 'value'),
    };
  }

  throw new Error(
    `Unknown LaneOffsetTarget type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLateralDistanceAction(raw: any): LateralDistanceAction {
  return {
    type: 'lateralDistanceAction',
    entityRef: strAttr(raw, 'entityRef'),
    distance: optNumAttr(raw, 'distance'),
    freespace: boolAttr(raw, 'freespace'),
    continuous: boolAttr(raw, 'continuous'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystem | undefined,
    displacement: optStrAttr(raw, 'displacement') as LateralDisplacement | undefined,
    dynamics: raw.DynamicConstraints
      ? parseDynamicConstraints(raw.DynamicConstraints)
      : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDynamicConstraints(raw: any): DynamicConstraints {
  return {
    maxAcceleration: optNumAttr(raw, 'maxAcceleration'),
    maxDeceleration: optNumAttr(raw, 'maxDeceleration'),
    maxSpeed: optNumAttr(raw, 'maxSpeed'),
  };
}

// ---------------------------------------------------------------------------
// Teleport action
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTeleportAction(raw: any): TeleportAction {
  return {
    type: 'teleportAction',
    position: parsePosition(raw.Position),
  };
}

// ---------------------------------------------------------------------------
// Synchronize action
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSynchronizeAction(raw: any): SynchronizeAction {
  return {
    type: 'synchronizeAction',
    masterEntityRef: strAttr(raw, 'masterEntityRef'),
    // TargetPositionMaster/TargetPosition contain position elements DIRECTLY
    // (e.g. <LanePosition>), not wrapped in <Position>
    targetPositionMaster: parsePosition(raw.TargetPositionMaster),
    targetPosition: parsePosition(raw.TargetPosition),
    finalSpeed: raw.FinalSpeed ? parseFinalSpeed(raw.FinalSpeed) : undefined,
    toleranceMaster: optNumAttr(raw, 'toleranceMaster'),
    tolerance: optNumAttr(raw, 'tolerance'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFinalSpeed(raw: any): FinalSpeed {
  const result: FinalSpeed = {};

  if (raw.AbsoluteSpeed) {
    result.absoluteSpeed = {
      value: numAttr(raw.AbsoluteSpeed, 'value'),
      steadyState: optBoolAttr(raw.AbsoluteSpeed, 'steadyState'),
    };
  }
  if (raw.RelativeSpeedToMaster) {
    result.relativeSpeedToMaster = {
      value: numAttr(raw.RelativeSpeedToMaster, 'value'),
      speedTargetValueType: strAttr(
        raw.RelativeSpeedToMaster,
        'speedTargetValueType',
        'delta',
      ) as 'delta' | 'factor',
      steadyState: optBoolAttr(raw.RelativeSpeedToMaster, 'steadyState'),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Controller actions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseControllerAction(raw: any): PrivateAction {
  if (raw.AssignControllerAction) {
    return parseAssignControllerAction(raw.AssignControllerAction);
  }
  if (raw.ActivateControllerAction) {
    return parseActivateControllerAction(raw.ActivateControllerAction);
  }
  if (raw.OverrideControllerValueAction) {
    return parseOverrideControllerAction(raw.OverrideControllerValueAction);
  }

  throw new Error(
    `Unknown ControllerAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAssignControllerAction(raw: any): AssignControllerAction {
  const result: AssignControllerAction = {
    type: 'assignControllerAction',
    activateLateral: optBoolAttr(raw, 'activateLateral'),
    activateLongitudinal: optBoolAttr(raw, 'activateLongitudinal'),
    activateAnimation: optBoolAttr(raw, 'activateAnimation'),
    activateLighting: optBoolAttr(raw, 'activateLighting'),
  };

  if (raw.Controller) {
    result.controller = {
      name: strAttr(raw.Controller, 'name'),
      properties: raw.Controller.Properties
        ? ensureArray(raw.Controller.Properties.Property).map(parseProperty)
        : [],
    };
  }

  if (raw.CatalogReference) {
    result.catalogReference = {
      catalogName: strAttr(raw.CatalogReference, 'catalogName'),
      entryName: strAttr(raw.CatalogReference, 'entryName'),
    };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProperty(raw: any): Property {
  return {
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseActivateControllerAction(raw: any): ActivateControllerAction {
  return {
    type: 'activateControllerAction',
    lateral: optBoolAttr(raw, 'lateral'),
    longitudinal: optBoolAttr(raw, 'longitudinal'),
    animation: optBoolAttr(raw, 'animation'),
    lighting: optBoolAttr(raw, 'lighting'),
    controllerRef: optStrAttr(raw, 'controllerRef'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOverrideControllerAction(raw: any): OverrideControllerAction {
  return {
    type: 'overrideControllerAction',
    throttle: raw.Throttle ? parseOverrideValue(raw.Throttle) : undefined,
    brake: raw.Brake ? parseOverrideValue(raw.Brake) : undefined,
    clutch: raw.Clutch ? parseOverrideValue(raw.Clutch) : undefined,
    parkingBrake: raw.ParkingBrake ? parseOverrideValue(raw.ParkingBrake) : undefined,
    steeringWheel: raw.SteeringWheel ? parseOverrideValue(raw.SteeringWheel) : undefined,
    gear: raw.Gear ? parseOverrideGearValue(raw.Gear) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOverrideValue(raw: any): OverrideValue {
  return {
    value: numAttr(raw, 'value'),
    active: boolAttr(raw, 'active'),
    maxRate: optNumAttr(raw, 'maxRate'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOverrideGearValue(raw: any): OverrideGearValue {
  return {
    number: optNumAttr(raw, 'number'),
    active: boolAttr(raw, 'active'),
  };
}

// ---------------------------------------------------------------------------
// Routing actions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoutingAction(raw: any): PrivateAction {
  if (raw.AssignRouteAction) {
    return parseAssignRouteAction(raw.AssignRouteAction);
  }
  if (raw.AcquirePositionAction) {
    // AcquirePositionAction under RoutingAction maps to RoutingAction type
    return parseRoutingAcquirePositionAction(raw.AcquirePositionAction);
  }
  if (raw.FollowTrajectoryAction) {
    return parseFollowTrajectoryAction(raw.FollowTrajectoryAction);
  }

  throw new Error(
    `Unknown RoutingAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAssignRouteAction(raw: any): RoutingAction {
  const result: RoutingAction = {
    type: 'routingAction',
    routeAction: 'assignRoute',
  };

  if (raw.Route) {
    result.route = {
      name: strAttr(raw.Route, 'name'),
      closed: boolAttr(raw.Route, 'closed'),
      waypoints: ensureArray(raw.Route.Waypoint).map(parseRouteWaypoint),
    };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRouteWaypoint(raw: any): { position: ReturnType<typeof parsePosition>; routeStrategy: string } {
  return {
    position: parsePosition(raw.Position),
    routeStrategy: strAttr(raw, 'routeStrategy', 'shortest'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoutingAcquirePositionAction(raw: any): RoutingAction {
  return {
    type: 'routingAction',
    routeAction: 'acquirePosition',
    position: parsePosition(raw.Position),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFollowTrajectoryAction(raw: any): FollowTrajectoryAction {
  // Trajectory can be inline or via TrajectoryRef (catalog reference)
  const trajectory: Trajectory = raw.Trajectory
    ? parseTrajectory(raw.Trajectory)
    : { name: raw.TrajectoryRef?.CatalogReference?.['@_entryName'] ?? '', closed: false, shape: { type: 'polyline', vertices: [] } };

  return {
    type: 'followTrajectoryAction',
    trajectory,
    timeReference: parseTimeReference(raw.TimeReference),
    followingMode: strAttr(
      raw.TrajectoryFollowingMode,
      'followingMode',
      'follow',
    ) as FollowingMode,
    initialDistanceOffset: optNumAttr(raw, 'initialDistanceOffset'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrajectory(raw: any): Trajectory {
  if (!raw) throw new Error('Trajectory element is missing');
  return {
    name: strAttr(raw, 'name'),
    closed: boolAttr(raw, 'closed'),
    shape: parseTrajectoryShape(raw.Shape),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrajectoryShape(raw: any): TrajectoryShape {
  if (!raw) throw new Error('Shape element is missing in Trajectory');

  if (raw.Polyline) {
    return {
      type: 'polyline',
      vertices: ensureArray(raw.Polyline.Vertex).map(parseTrajectoryVertex),
    };
  }
  if (raw.Clothoid) {
    return {
      type: 'clothoid',
      curvature: numAttr(raw.Clothoid, 'curvature'),
      curvatureDot: numAttr(raw.Clothoid, 'curvatureDot'),
      length: numAttr(raw.Clothoid, 'length'),
      startTime: optNumAttr(raw.Clothoid, 'startTime'),
      stopTime: optNumAttr(raw.Clothoid, 'stopTime'),
      position: raw.Clothoid.Position
        ? parsePosition(raw.Clothoid.Position)
        : undefined,
    };
  }
  if (raw.Nurbs) {
    return {
      type: 'nurbs',
      order: numAttr(raw.Nurbs, 'order'),
      controlPoints: ensureArray(raw.Nurbs.ControlPoint).map(parseNurbsControlPoint),
      knots: ensureArray(raw.Nurbs.Knot).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (k: any) => numAttr(k, 'value'),
      ),
    };
  }

  throw new Error(
    `Unknown TrajectoryShape type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrajectoryVertex(raw: any): TrajectoryVertex {
  return {
    position: parsePosition(raw.Position),
    time: optNumAttr(raw, 'time'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNurbsControlPoint(raw: any): NurbsControlPoint {
  return {
    position: parsePosition(raw.Position),
    time: optNumAttr(raw, 'time'),
    weight: optNumAttr(raw, 'weight'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTimeReference(raw: any): TimeReference {
  if (!raw) return { none: true };

  if (raw.None !== undefined) {
    return { none: true };
  }
  if (raw.Timing) {
    return {
      timing: {
        domainAbsoluteRelative: strAttr(
          raw.Timing,
          'domainAbsoluteRelative',
          'absolute',
        ) as 'absolute' | 'relative',
        offset: numAttr(raw.Timing, 'offset'),
        scale: numAttr(raw.Timing, 'scale', 1),
      },
    };
  }

  return { none: true };
}

// ---------------------------------------------------------------------------
// Visibility action
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVisibilityAction(raw: any): VisibilityAction {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAppearanceAction(raw: any): AppearanceAction {
  // AppearanceAction is a placeholder with [key: string]: unknown
  const result: AppearanceAction = { type: 'appearanceAction' };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(raw)) {
      if (!key.startsWith('@_')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = raw[key];
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Animation action
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAnimationAction(raw: any): AnimationAction {
  // AnimationAction has an AnimationType child element with the animation type
  const animationType = raw.AnimationType
    ? parseAnimationType(raw.AnimationType)
    : strAttr(raw, 'animationType', '');

  return {
    type: 'animationAction',
    animationType,
    state: optStrAttr(raw, 'state'),
    duration: optNumAttr(raw, 'duration'),
    loop: optBoolAttr(raw, 'loop'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAnimationType(raw: any): string {
  // AnimationType can contain VehicleComponentAnimation, PedestrianAnimation,
  // AnimationFile, or UserDefinedAnimation
  if (raw.VehicleComponentAnimation) {
    return strAttr(raw.VehicleComponentAnimation, 'vehicleComponentType', '');
  }
  if (raw.PedestrianAnimation) {
    // Could be motion or gesture
    return strAttr(raw.PedestrianAnimation, 'motion', '') ||
      strAttr(raw.PedestrianAnimation, 'gesture', '');
  }
  if (raw.AnimationFile) {
    return strAttr(raw.AnimationFile, 'file', '');
  }
  if (raw.UserDefinedAnimation) {
    return strAttr(raw.UserDefinedAnimation, 'type', '');
  }
  return '';
}

// ---------------------------------------------------------------------------
// Light state action
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLightStateAction(raw: any): LightStateAction {
  const lightState = raw.LightState;
  const lightType = raw.LightType;

  const result: LightStateAction = {
    type: 'lightStateAction',
    lightType: parseLightType(lightType),
    mode: strAttr(lightState, 'mode', 'off') as 'on' | 'off' | 'flashing',
    intensity: optNumAttr(lightState, 'intensity'),
    transitionTime: optNumAttr(raw, 'transitionTime'),
  };

  if (lightState?.Color) {
    result.color = {
      r: numAttr(lightState.Color.ColorRgb ?? lightState.Color, 'red', 0),
      g: numAttr(lightState.Color.ColorRgb ?? lightState.Color, 'green', 0),
      b: numAttr(lightState.Color.ColorRgb ?? lightState.Color, 'blue', 0),
    };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLightType(raw: any): string {
  if (!raw) return '';
  if (raw.VehicleLightType) {
    return strAttr(raw.VehicleLightType, 'vehicleLightType', '') ||
      (typeof raw.VehicleLightType === 'string' ? raw.VehicleLightType : '');
  }
  if (raw.UserDefinedLightType) {
    return strAttr(raw.UserDefinedLightType, 'type', '');
  }
  return '';
}

// ---------------------------------------------------------------------------
// Trailer actions
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseConnectTrailerAction(raw: any): ConnectTrailerAction {
  return {
    type: 'connectTrailerAction',
    trailerRef: strAttr(raw, 'trailerRef', '') || strAttr(raw.TrailerRef, 'entityRef', ''),
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEnvironmentAction(raw: any): EnvironmentAction {
  return {
    type: 'environmentAction',
    environment: parseEnvironment(raw.Environment),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEnvironment(raw: any): Environment {
  if (!raw) throw new Error('Environment element is missing');
  return {
    name: strAttr(raw, 'name'),
    timeOfDay: parseTimeOfDay(raw.TimeOfDay),
    weather: parseWeather(raw.Weather),
    roadCondition: parseRoadCondition(raw.RoadCondition),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTimeOfDay(raw: any): TimeOfDay {
  if (!raw) return { animation: false, dateTime: '' };
  return {
    animation: boolAttr(raw, 'animation'),
    dateTime: strAttr(raw, 'dateTime'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWeather(raw: any): Weather {
  if (!raw) return {};
  const result: Weather = {
    fractionalCloudCover: optStrAttr(raw, 'fractionalCloudCover'),
    atmosphericPressure: optNumAttr(raw, 'atmosphericPressure'),
    temperature: optNumAttr(raw, 'temperature'),
  };

  if (raw.Sun) {
    result.sun = {
      intensity: numAttr(raw.Sun, 'intensity'),
      azimuth: numAttr(raw.Sun, 'azimuth'),
      elevation: numAttr(raw.Sun, 'elevation'),
    };
  }

  if (raw.Fog) {
    result.fog = {
      visualRange: numAttr(raw.Fog, 'visualRange'),
      boundingBox: raw.Fog.BoundingBox
        ? {
            center: {
              x: numAttr(raw.Fog.BoundingBox.Center, 'x'),
              y: numAttr(raw.Fog.BoundingBox.Center, 'y'),
              z: numAttr(raw.Fog.BoundingBox.Center, 'z'),
            },
            dimensions: {
              width: numAttr(raw.Fog.BoundingBox.Dimensions, 'width'),
              length: numAttr(raw.Fog.BoundingBox.Dimensions, 'length'),
              height: numAttr(raw.Fog.BoundingBox.Dimensions, 'height'),
            },
          }
        : undefined,
    };
  }

  if (raw.Precipitation) {
    result.precipitation = {
      precipitationType: strAttr(raw.Precipitation, 'precipitationType', 'dry'),
      precipitationIntensity: numAttr(raw.Precipitation, 'precipitationIntensity'),
    };
  }

  if (raw.Wind) {
    result.wind = {
      direction: numAttr(raw.Wind, 'direction'),
      speed: numAttr(raw.Wind, 'speed'),
    };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRoadCondition(raw: any): RoadCondition {
  if (!raw) return { frictionScaleFactor: 1.0 };
  return {
    frictionScaleFactor: numAttr(raw, 'frictionScaleFactor', 1.0),
    wetness: optStrAttr(raw, 'wetness'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntityAction(raw: any): EntityAction {
  const entityRef = strAttr(raw, 'entityRef');

  if (raw.AddEntityAction) {
    return {
      type: 'entityAction',
      entityRef,
      actionType: 'addEntity',
      position: raw.AddEntityAction.Position
        ? parsePosition(raw.AddEntityAction.Position)
        : undefined,
    };
  }
  if (raw.DeleteEntityAction !== undefined) {
    return {
      type: 'entityAction',
      entityRef,
      actionType: 'deleteEntity',
    };
  }

  throw new Error(
    `Unknown EntityAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterAction(raw: any): ParameterAction {
  const parameterRef = strAttr(raw, 'parameterRef');

  if (raw.SetAction) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'set',
      value: strAttr(raw.SetAction, 'value'),
    };
  }
  if (raw.ModifyAction) {
    return parseParameterModifyAction(raw.ModifyAction, parameterRef);
  }

  throw new Error(
    `Unknown ParameterAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterModifyAction(raw: any, parameterRef: string): ParameterAction {
  const rule = raw.Rule;
  if (!rule) throw new Error('ModifyAction missing Rule element');

  if (rule.AddValue) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: numAttr(rule.AddValue, 'value'),
    };
  }
  if (rule.MultiplyByValue) {
    return {
      type: 'parameterAction',
      parameterRef,
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: numAttr(rule.MultiplyByValue, 'value'),
    };
  }

  throw new Error(
    `Unknown ParameterAction ModifyAction Rule type: ${Object.keys(rule).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVariableAction(raw: any): VariableAction {
  const variableRef = strAttr(raw, 'variableRef');

  if (raw.SetAction) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'set',
      value: strAttr(raw.SetAction, 'value'),
    };
  }
  if (raw.ModifyAction) {
    return parseVariableModifyAction(raw.ModifyAction, variableRef);
  }

  throw new Error(
    `Unknown VariableAction type: ${Object.keys(raw).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVariableModifyAction(raw: any, variableRef: string): VariableAction {
  const rule = raw.Rule;
  if (!rule) throw new Error('ModifyAction missing Rule element');

  if (rule.AddValue) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: numAttr(rule.AddValue, 'value'),
    };
  }
  if (rule.MultiplyByValue) {
    return {
      type: 'variableAction',
      variableRef,
      actionType: 'modify',
      rule: 'multiplyByValue',
      modifyValue: numAttr(rule.MultiplyByValue, 'value'),
    };
  }

  throw new Error(
    `Unknown VariableAction ModifyAction Rule type: ${Object.keys(rule).join(', ')}`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInfrastructureAction(raw: any): InfrastructureAction {
  return {
    type: 'infrastructureAction',
    trafficSignalAction: parseTrafficSignalAction(raw.TrafficSignalAction),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalAction(raw: any): TrafficSignalAction {
  if (!raw) throw new Error('TrafficSignalAction element is missing');

  const result: TrafficSignalAction = {};

  if (raw.TrafficSignalControllerAction) {
    const ctrl = raw.TrafficSignalControllerAction;
    result.controllerRef = strAttr(ctrl, 'trafficSignalControllerRef');
    if (ctrl.TrafficSignalControllerCondition) {
      result.controllerAction = {
        phase: strAttr(ctrl.TrafficSignalControllerCondition, 'phase'),
      };
    }
  }

  if (raw.TrafficSignalStateAction) {
    result.stateAction = {
      name: strAttr(raw.TrafficSignalStateAction, 'name'),
      state: strAttr(raw.TrafficSignalStateAction, 'state'),
    };
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficAction(raw: any): TrafficAction {
  // TrafficAction is a placeholder with [key: string]: unknown
  const result: TrafficAction = { type: 'trafficAction' };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(raw)) {
      if (!key.startsWith('@_')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = raw[key];
      }
    }
  }
  return result;
}
