import type {
  ByEntityCondition,
  ByValueCondition,
  TriggeringEntities,
  EntityCondition,
  ValueCondition,
  DistanceCondition,
  RelativeDistanceCondition,
  TimeHeadwayCondition,
  TimeToCollisionCondition,
  TimeToCollisionTarget,
  AccelerationCondition,
  SpeedCondition,
  RelativeSpeedCondition,
  ReachPositionCondition,
  StandStillCondition,
  TraveledDistanceCondition,
  EndOfRoadCondition,
  CollisionCondition,
  CollisionTarget,
  OffroadCondition,
  RelativeClearanceCondition,
  SimulationTimeCondition,
  StoryboardElementStateCondition,
  StoryboardElementType,
  StoryboardElementState,
  ParameterCondition,
  VariableCondition,
  TrafficSignalCondition,
  TrafficSignalControllerCondition,
  UserDefinedValueCondition,
  CoordinateSystemCond,
  RelativeDistanceType,
  DirectionalDimension,
  Rule,
} from '@osce/shared';
import { parsePosition } from './parse-positions.js';
import { ensureArray } from '../utils/ensure-array.js';
import { numAttr, strAttr, optNumAttr, optStrAttr, boolAttr, optBoolAttr } from '../utils/xml-helpers.js';

/**
 * Parse a condition body element (ByEntityCondition or ByValueCondition)
 * from parsed XML into the internal representation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseConditionBody(raw: any): ByEntityCondition | ByValueCondition {
  if (raw.ByEntityCondition) {
    return parseByEntityCondition(raw.ByEntityCondition);
  }
  if (raw.ByValueCondition) {
    return parseByValueCondition(raw.ByValueCondition);
  }
  throw new Error(`Unknown condition body: ${Object.keys(raw).join(', ')}`);
}

// ---------------------------------------------------------------------------
// ByEntityCondition
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseByEntityCondition(raw: any): ByEntityCondition {
  return {
    kind: 'byEntity',
    triggeringEntities: parseTriggeringEntities(raw.TriggeringEntities),
    entityCondition: parseEntityCondition(raw.EntityCondition),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTriggeringEntities(raw: any): TriggeringEntities {
  return {
    triggeringEntitiesRule: strAttr(raw, 'triggeringEntitiesRule', 'any') as 'any' | 'all',
    entityRefs: ensureArray(raw?.EntityRef).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ref: any) => strAttr(ref, 'entityRef'),
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEntityCondition(raw: any): EntityCondition {
  if (!raw) throw new Error('EntityCondition element is missing');

  if (raw.DistanceCondition) return parseDistanceCondition(raw.DistanceCondition);
  if (raw.RelativeDistanceCondition) return parseRelativeDistanceCondition(raw.RelativeDistanceCondition);
  if (raw.TimeHeadwayCondition) return parseTimeHeadwayCondition(raw.TimeHeadwayCondition);
  if (raw.TimeToCollisionCondition) return parseTimeToCollisionCondition(raw.TimeToCollisionCondition);
  if (raw.AccelerationCondition) return parseAccelerationCondition(raw.AccelerationCondition);
  if (raw.SpeedCondition) return parseSpeedCondition(raw.SpeedCondition);
  if (raw.RelativeSpeedCondition) return parseRelativeSpeedCondition(raw.RelativeSpeedCondition);
  if (raw.ReachPositionCondition) return parseReachPositionCondition(raw.ReachPositionCondition);
  if (raw.StandStillCondition) return parseStandStillCondition(raw.StandStillCondition);
  if (raw.TraveledDistanceCondition) return parseTraveledDistanceCondition(raw.TraveledDistanceCondition);
  if (raw.EndOfRoadCondition) return parseEndOfRoadCondition(raw.EndOfRoadCondition);
  if (raw.CollisionCondition) return parseCollisionCondition(raw.CollisionCondition);
  if (raw.OffroadCondition) return parseOffroadCondition(raw.OffroadCondition);
  if (raw.RelativeClearanceCondition) return parseRelativeClearanceCondition(raw.RelativeClearanceCondition);

  throw new Error(`Unknown EntityCondition type: ${Object.keys(raw).join(', ')}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDistanceCondition(raw: any): DistanceCondition {
  return {
    type: 'distance',
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystemCond | undefined,
    relativeDistanceType: optStrAttr(raw, 'relativeDistanceType') as RelativeDistanceType | undefined,
    rule: strAttr(raw, 'rule') as Rule,
    position: parsePosition(raw.Position),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeDistanceCondition(raw: any): RelativeDistanceCondition {
  return {
    type: 'relativeDistance',
    entityRef: strAttr(raw, 'entityRef'),
    relativeDistanceType: strAttr(raw, 'relativeDistanceType') as RelativeDistanceType,
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTimeHeadwayCondition(raw: any): TimeHeadwayCondition {
  return {
    type: 'timeHeadway',
    entityRef: strAttr(raw, 'entityRef'),
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    rule: strAttr(raw, 'rule') as Rule,
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystemCond | undefined,
    alongRoute: optBoolAttr(raw, 'alongRoute'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTimeToCollisionCondition(raw: any): TimeToCollisionCondition {
  return {
    type: 'timeToCollision',
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    rule: strAttr(raw, 'rule') as Rule,
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystemCond | undefined,
    relativeDistanceType: optStrAttr(raw, 'relativeDistanceType') as RelativeDistanceType | undefined,
    target: parseTimeToCollisionTarget(raw.TimeToCollisionConditionTarget),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTimeToCollisionTarget(raw: any): TimeToCollisionTarget {
  if (!raw) throw new Error('TimeToCollisionConditionTarget element is missing');

  if (raw.EntityRef) {
    return {
      kind: 'entity',
      entityRef: strAttr(raw.EntityRef, 'entityRef'),
    };
  }
  if (raw.Position) {
    return {
      kind: 'position',
      position: parsePosition(raw.Position),
    };
  }
  throw new Error(`Unknown TimeToCollisionConditionTarget: ${Object.keys(raw).join(', ')}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAccelerationCondition(raw: any): AccelerationCondition {
  return {
    type: 'acceleration',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSpeedCondition(raw: any): SpeedCondition {
  return {
    type: 'speed',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeSpeedCondition(raw: any): RelativeSpeedCondition {
  return {
    type: 'relativeSpeed',
    entityRef: strAttr(raw, 'entityRef'),
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReachPositionCondition(raw: any): ReachPositionCondition {
  return {
    type: 'reachPosition',
    tolerance: numAttr(raw, 'tolerance'),
    position: parsePosition(raw.Position),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStandStillCondition(raw: any): StandStillCondition {
  return {
    type: 'standStill',
    duration: numAttr(raw, 'duration'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTraveledDistanceCondition(raw: any): TraveledDistanceCondition {
  return {
    type: 'traveledDistance',
    value: numAttr(raw, 'value'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEndOfRoadCondition(raw: any): EndOfRoadCondition {
  return {
    type: 'endOfRoad',
    duration: numAttr(raw, 'duration'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCollisionCondition(raw: any): CollisionCondition {
  return {
    type: 'collision',
    target: parseCollisionTarget(raw),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCollisionTarget(raw: any): CollisionTarget {
  if (raw.EntityRef) {
    return {
      kind: 'entity',
      entityRef: strAttr(raw.EntityRef, 'entityRef'),
    };
  }
  if (raw.ByType) {
    return {
      kind: 'objectType',
      objectType: strAttr(raw.ByType, 'type'),
    };
  }
  throw new Error(`Unknown CollisionCondition target: ${Object.keys(raw).join(', ')}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOffroadCondition(raw: any): OffroadCondition {
  return {
    type: 'offroad',
    duration: numAttr(raw, 'duration'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRelativeClearanceCondition(raw: any): RelativeClearanceCondition {
  return {
    type: 'relativeClearance',
    distanceForward: optNumAttr(raw, 'distanceForward'),
    distanceBackward: optNumAttr(raw, 'distanceBackward'),
    freeSpace: boolAttr(raw, 'freeSpace'),
    oppositeLanes: boolAttr(raw, 'oppositeLanes'),
    entityRefs: ensureArray(raw?.EntityRef).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ref: any) => strAttr(ref, 'entityRef'),
    ),
    laneRange: raw?.RelativeLaneRange
      ? ensureArray(raw.RelativeLaneRange).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lr: any) => ({
            from: numAttr(lr, 'from'),
            to: numAttr(lr, 'to'),
          }),
        )
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// ByValueCondition
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseByValueCondition(raw: any): ByValueCondition {
  return {
    kind: 'byValue',
    valueCondition: parseValueCondition(raw),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseValueCondition(raw: any): ValueCondition {
  if (!raw) throw new Error('ByValueCondition element is missing');

  if (raw.SimulationTimeCondition) return parseSimulationTimeCondition(raw.SimulationTimeCondition);
  if (raw.StoryboardElementStateCondition) return parseStoryboardElementStateCondition(raw.StoryboardElementStateCondition);
  if (raw.ParameterCondition) return parseParameterCondition(raw.ParameterCondition);
  if (raw.VariableCondition) return parseVariableCondition(raw.VariableCondition);
  if (raw.TrafficSignalCondition) return parseTrafficSignalCondition(raw.TrafficSignalCondition);
  if (raw.TrafficSignalControllerCondition) return parseTrafficSignalControllerCondition(raw.TrafficSignalControllerCondition);
  if (raw.UserDefinedValueCondition) return parseUserDefinedValueCondition(raw.UserDefinedValueCondition);

  throw new Error(`Unknown ByValueCondition type: ${Object.keys(raw).join(', ')}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSimulationTimeCondition(raw: any): SimulationTimeCondition {
  return {
    type: 'simulationTime',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStoryboardElementStateCondition(raw: any): StoryboardElementStateCondition {
  return {
    type: 'storyboardElementState',
    storyboardElementRef: strAttr(raw, 'storyboardElementRef'),
    storyboardElementType: strAttr(raw, 'storyboardElementType') as StoryboardElementType,
    state: strAttr(raw, 'state') as StoryboardElementState,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseParameterCondition(raw: any): ParameterCondition {
  return {
    type: 'parameter',
    parameterRef: strAttr(raw, 'parameterRef'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVariableCondition(raw: any): VariableCondition {
  return {
    type: 'variable',
    variableRef: strAttr(raw, 'variableRef'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalCondition(raw: any): TrafficSignalCondition {
  return {
    type: 'trafficSignal',
    name: strAttr(raw, 'name'),
    state: strAttr(raw, 'state'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrafficSignalControllerCondition(raw: any): TrafficSignalControllerCondition {
  return {
    type: 'trafficSignalController',
    trafficSignalControllerRef: strAttr(raw, 'trafficSignalControllerRef'),
    phase: strAttr(raw, 'phase'),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUserDefinedValueCondition(raw: any): UserDefinedValueCondition {
  return {
    type: 'userDefinedValue',
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}
