import type {
  SpeedAction,
  LaneChangeAction,
  TeleportAction,
  LongitudinalDistanceAction,
  LateralDistanceAction,
  Position,
  DynamicsShape,
  DynamicsDimension,
} from '@osce/shared';

export function createSpeedActionObj(
  targetSpeed: number,
  dynamicsShape: DynamicsShape = 'step',
  dynamicsDimension: DynamicsDimension = 'time',
  dynamicsValue: number = 0,
): SpeedAction {
  return {
    type: 'speedAction',
    dynamics: { dynamicsShape, dynamicsDimension, value: dynamicsValue },
    target: { kind: 'absolute', value: targetSpeed },
  };
}

export function createRelativeSpeedActionObj(
  entityRef: string,
  deltaSpeed: number,
  dynamicsShape: DynamicsShape = 'linear',
  dynamicsDimension: DynamicsDimension = 'time',
  dynamicsValue: number = 3,
): SpeedAction {
  return {
    type: 'speedAction',
    dynamics: { dynamicsShape, dynamicsDimension, value: dynamicsValue },
    target: {
      kind: 'relative',
      entityRef,
      value: deltaSpeed,
      speedTargetValueType: 'delta',
      continuous: false,
    },
  };
}

export function createBrakeActionObj(
  deceleration: number,
): SpeedAction {
  return {
    type: 'speedAction',
    dynamics: { dynamicsShape: 'linear', dynamicsDimension: 'rate', value: -Math.abs(deceleration) },
    target: { kind: 'absolute', value: 0 },
  };
}

export function createLaneChangeActionObj(
  targetLane: number,
  isRelative: boolean,
  entityRef: string | undefined,
  dynamicsShape: DynamicsShape = 'cubic',
  dynamicsDimension: DynamicsDimension = 'distance',
  dynamicsValue: number = 50,
  targetLaneOffset?: number,
): LaneChangeAction {
  return {
    type: 'laneChangeAction',
    dynamics: { dynamicsShape, dynamicsDimension, value: dynamicsValue },
    target: isRelative
      ? { kind: 'relative', entityRef: entityRef!, value: targetLane }
      : { kind: 'absolute', value: targetLane },
    targetLaneOffset,
  };
}

export function createTeleportActionObj(position: Position): TeleportAction {
  return { type: 'teleportAction', position };
}

export function createLongitudinalDistanceActionObj(
  entityRef: string,
  distance?: number,
  timeGap?: number,
  freespace: boolean = false,
  continuous: boolean = true,
): LongitudinalDistanceAction {
  return {
    type: 'longitudinalDistanceAction',
    entityRef,
    distance,
    timeGap,
    freespace,
    continuous,
  };
}

export function createLateralDistanceActionObj(
  entityRef: string,
  distance: number,
  freespace: boolean = false,
  continuous: boolean = true,
): LateralDistanceAction {
  return {
    type: 'lateralDistanceAction',
    entityRef,
    distance,
    freespace,
    continuous,
  };
}
