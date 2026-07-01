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
import type { RawXml } from '../utils/xml-helpers.js';
import { parsePosition } from './parse-positions.js';
import { numAttr, strAttr, optNumAttr, optStrAttr, boolAttr, optBoolAttr, pushBindingFieldPrefix, popBindingFieldPrefix, child, children, has, rawKeys } from '../utils/xml-helpers.js';

/**
 * Parse a condition body element (ByEntityCondition or ByValueCondition)
 * from parsed XML into the internal representation.
 */
export function parseConditionBody(raw: RawXml): ByEntityCondition | ByValueCondition {
  const byEntity = child(raw, 'ByEntityCondition');
  if (byEntity) {
    return parseByEntityCondition(byEntity);
  }
  const byValue = child(raw, 'ByValueCondition');
  if (byValue) {
    return parseByValueCondition(byValue);
  }
  throw new Error(`Unknown condition body: ${rawKeys(raw).join(', ')}`);
}

// ---------------------------------------------------------------------------
// ByEntityCondition
// ---------------------------------------------------------------------------

function parseByEntityCondition(raw: RawXml): ByEntityCondition {
  return {
    kind: 'byEntity',
    triggeringEntities: parseTriggeringEntities(child(raw, 'TriggeringEntities')),
    entityCondition: parseEntityCondition(child(raw, 'EntityCondition')),
  };
}

function parseTriggeringEntities(raw: RawXml | undefined): TriggeringEntities {
  return {
    triggeringEntitiesRule: strAttr(raw, 'triggeringEntitiesRule', 'any') as 'any' | 'all',
    entityRefs: children(raw, 'EntityRef').map((ref) => strAttr(ref, 'entityRef')),
  };
}

function parseEntityCondition(raw: RawXml | undefined): EntityCondition {
  if (!raw) throw new Error('EntityCondition element is missing');

  const distance = child(raw, 'DistanceCondition');
  if (distance) return parseDistanceCondition(distance);
  const relativeDistance = child(raw, 'RelativeDistanceCondition');
  if (relativeDistance) return parseRelativeDistanceCondition(relativeDistance);
  const timeHeadway = child(raw, 'TimeHeadwayCondition');
  if (timeHeadway) return parseTimeHeadwayCondition(timeHeadway);
  const timeToCollision = child(raw, 'TimeToCollisionCondition');
  if (timeToCollision) return parseTimeToCollisionCondition(timeToCollision);
  const acceleration = child(raw, 'AccelerationCondition');
  if (acceleration) return parseAccelerationCondition(acceleration);
  const speed = child(raw, 'SpeedCondition');
  if (speed) return parseSpeedCondition(speed);
  const relativeSpeed = child(raw, 'RelativeSpeedCondition');
  if (relativeSpeed) return parseRelativeSpeedCondition(relativeSpeed);
  const reachPosition = child(raw, 'ReachPositionCondition');
  if (reachPosition) return parseReachPositionCondition(reachPosition);
  const standStill = child(raw, 'StandStillCondition');
  if (standStill) return parseStandStillCondition(standStill);
  const traveledDistance = child(raw, 'TraveledDistanceCondition');
  if (traveledDistance) return parseTraveledDistanceCondition(traveledDistance);
  const endOfRoad = child(raw, 'EndOfRoadCondition');
  if (endOfRoad) return parseEndOfRoadCondition(endOfRoad);
  const collision = child(raw, 'CollisionCondition');
  if (collision) return parseCollisionCondition(collision);
  const offroad = child(raw, 'OffroadCondition');
  if (offroad) return parseOffroadCondition(offroad);
  const relativeClearance = child(raw, 'RelativeClearanceCondition');
  if (relativeClearance) return parseRelativeClearanceCondition(relativeClearance);

  throw new Error(`Unknown EntityCondition type: ${rawKeys(raw).join(', ')}`);
}

function parseDistanceCondition(raw: RawXml): DistanceCondition {
  pushBindingFieldPrefix('position');
  const position = parsePosition(child(raw, 'Position'));
  popBindingFieldPrefix();

  return {
    type: 'distance',
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystemCond | undefined,
    relativeDistanceType: optStrAttr(raw, 'relativeDistanceType') as RelativeDistanceType | undefined,
    rule: strAttr(raw, 'rule') as Rule,
    position,
  };
}

function parseRelativeDistanceCondition(raw: RawXml): RelativeDistanceCondition {
  return {
    type: 'relativeDistance',
    entityRef: strAttr(raw, 'entityRef'),
    relativeDistanceType: strAttr(raw, 'relativeDistanceType') as RelativeDistanceType,
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

function parseTimeHeadwayCondition(raw: RawXml): TimeHeadwayCondition {
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

function parseTimeToCollisionCondition(raw: RawXml): TimeToCollisionCondition {
  return {
    type: 'timeToCollision',
    value: numAttr(raw, 'value'),
    freespace: boolAttr(raw, 'freespace'),
    rule: strAttr(raw, 'rule') as Rule,
    coordinateSystem: optStrAttr(raw, 'coordinateSystem') as CoordinateSystemCond | undefined,
    relativeDistanceType: optStrAttr(raw, 'relativeDistanceType') as RelativeDistanceType | undefined,
    target: parseTimeToCollisionTarget(child(raw, 'TimeToCollisionConditionTarget')),
  };
}

function parseTimeToCollisionTarget(raw: RawXml | undefined): TimeToCollisionTarget {
  if (!raw) throw new Error('TimeToCollisionConditionTarget element is missing');

  // EntityRef is parsed as an array by fxp-config; `child` returns the first.
  const ref = child(raw, 'EntityRef');
  if (ref) {
    return {
      kind: 'entity',
      entityRef: strAttr(ref, 'entityRef'),
    };
  }
  const position = child(raw, 'Position');
  if (position) {
    return {
      kind: 'position',
      position: parsePosition(position),
    };
  }
  throw new Error(`Unknown TimeToCollisionConditionTarget: ${rawKeys(raw).join(', ')}`);
}

function parseAccelerationCondition(raw: RawXml): AccelerationCondition {
  return {
    type: 'acceleration',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

function parseSpeedCondition(raw: RawXml): SpeedCondition {
  return {
    type: 'speed',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

function parseRelativeSpeedCondition(raw: RawXml): RelativeSpeedCondition {
  return {
    type: 'relativeSpeed',
    entityRef: strAttr(raw, 'entityRef'),
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
    direction: optStrAttr(raw, 'direction') as DirectionalDimension | undefined,
  };
}

function parseReachPositionCondition(raw: RawXml): ReachPositionCondition {
  pushBindingFieldPrefix('position');
  const position = parsePosition(child(raw, 'Position'));
  popBindingFieldPrefix();

  return {
    type: 'reachPosition',
    tolerance: numAttr(raw, 'tolerance'),
    position,
  };
}

function parseStandStillCondition(raw: RawXml): StandStillCondition {
  return {
    type: 'standStill',
    duration: numAttr(raw, 'duration'),
  };
}

function parseTraveledDistanceCondition(raw: RawXml): TraveledDistanceCondition {
  return {
    type: 'traveledDistance',
    value: numAttr(raw, 'value'),
  };
}

function parseEndOfRoadCondition(raw: RawXml): EndOfRoadCondition {
  return {
    type: 'endOfRoad',
    duration: numAttr(raw, 'duration'),
  };
}

function parseCollisionCondition(raw: RawXml): CollisionCondition {
  return {
    type: 'collision',
    target: parseCollisionTarget(raw),
  };
}

function parseCollisionTarget(raw: RawXml): CollisionTarget {
  // EntityRef is parsed as an array by fxp-config; `child` returns the first.
  const ref = child(raw, 'EntityRef');
  if (ref) {
    return {
      kind: 'entity',
      entityRef: strAttr(ref, 'entityRef'),
    };
  }
  const byType = child(raw, 'ByType');
  if (byType) {
    return {
      kind: 'objectType',
      objectType: strAttr(byType, 'type'),
    };
  }
  throw new Error(`Unknown CollisionCondition target: ${rawKeys(raw).join(', ')}`);
}

function parseOffroadCondition(raw: RawXml): OffroadCondition {
  return {
    type: 'offroad',
    duration: numAttr(raw, 'duration'),
  };
}

function parseRelativeClearanceCondition(raw: RawXml): RelativeClearanceCondition {
  return {
    type: 'relativeClearance',
    distanceForward: optNumAttr(raw, 'distanceForward'),
    distanceBackward: optNumAttr(raw, 'distanceBackward'),
    freeSpace: boolAttr(raw, 'freeSpace'),
    oppositeLanes: boolAttr(raw, 'oppositeLanes'),
    entityRefs: children(raw, 'EntityRef').map((ref) => strAttr(ref, 'entityRef')),
    laneRange: has(raw, 'RelativeLaneRange')
      ? children(raw, 'RelativeLaneRange').map((lr) => ({
          from: numAttr(lr, 'from'),
          to: numAttr(lr, 'to'),
        }))
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// ByValueCondition
// ---------------------------------------------------------------------------

function parseByValueCondition(raw: RawXml): ByValueCondition {
  return {
    kind: 'byValue',
    valueCondition: parseValueCondition(raw),
  };
}

function parseValueCondition(raw: RawXml | undefined): ValueCondition {
  if (!raw) throw new Error('ByValueCondition element is missing');

  const simulationTime = child(raw, 'SimulationTimeCondition');
  if (simulationTime) return parseSimulationTimeCondition(simulationTime);
  const storyboardElementState = child(raw, 'StoryboardElementStateCondition');
  if (storyboardElementState) return parseStoryboardElementStateCondition(storyboardElementState);
  const parameter = child(raw, 'ParameterCondition');
  if (parameter) return parseParameterCondition(parameter);
  const variable = child(raw, 'VariableCondition');
  if (variable) return parseVariableCondition(variable);
  const trafficSignal = child(raw, 'TrafficSignalCondition');
  if (trafficSignal) return parseTrafficSignalCondition(trafficSignal);
  const trafficSignalController = child(raw, 'TrafficSignalControllerCondition');
  if (trafficSignalController) return parseTrafficSignalControllerCondition(trafficSignalController);
  const userDefinedValue = child(raw, 'UserDefinedValueCondition');
  if (userDefinedValue) return parseUserDefinedValueCondition(userDefinedValue);

  throw new Error(`Unknown ByValueCondition type: ${rawKeys(raw).join(', ')}`);
}

function parseSimulationTimeCondition(raw: RawXml): SimulationTimeCondition {
  return {
    type: 'simulationTime',
    value: numAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

function parseStoryboardElementStateCondition(raw: RawXml): StoryboardElementStateCondition {
  return {
    type: 'storyboardElementState',
    storyboardElementRef: strAttr(raw, 'storyboardElementRef'),
    storyboardElementType: strAttr(raw, 'storyboardElementType') as StoryboardElementType,
    state: strAttr(raw, 'state') as StoryboardElementState,
  };
}

function parseParameterCondition(raw: RawXml): ParameterCondition {
  return {
    type: 'parameter',
    parameterRef: strAttr(raw, 'parameterRef'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

function parseVariableCondition(raw: RawXml): VariableCondition {
  return {
    type: 'variable',
    variableRef: strAttr(raw, 'variableRef'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}

function parseTrafficSignalCondition(raw: RawXml): TrafficSignalCondition {
  return {
    type: 'trafficSignal',
    name: strAttr(raw, 'name'),
    state: strAttr(raw, 'state'),
  };
}

function parseTrafficSignalControllerCondition(raw: RawXml): TrafficSignalControllerCondition {
  return {
    type: 'trafficSignalController',
    trafficSignalControllerRef: strAttr(raw, 'trafficSignalControllerRef'),
    phase: strAttr(raw, 'phase'),
  };
}

function parseUserDefinedValueCondition(raw: RawXml): UserDefinedValueCondition {
  return {
    type: 'userDefinedValue',
    name: strAttr(raw, 'name'),
    value: strAttr(raw, 'value'),
    rule: strAttr(raw, 'rule') as Rule,
  };
}
