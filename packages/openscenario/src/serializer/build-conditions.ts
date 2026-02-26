import type {
  ByEntityCondition,
  ByValueCondition,
  EntityCondition,
  ValueCondition,
  DistanceCondition,
  RelativeDistanceCondition,
  TimeHeadwayCondition,
  TimeToCollisionCondition,
  AccelerationCondition,
  SpeedCondition,
  RelativeSpeedCondition,
  ReachPositionCondition,
  StandStillCondition,
  TraveledDistanceCondition,
  EndOfRoadCondition,
  CollisionCondition,
  OffroadCondition,
  RelativeClearanceCondition,
  SimulationTimeCondition,
  StoryboardElementStateCondition,
  ParameterCondition,
  VariableCondition,
  TrafficSignalCondition,
  TrafficSignalControllerCondition,
  UserDefinedValueCondition,
} from '@osce/shared';
import { buildPosition } from './build-positions.js';
import { buildAttrs } from '../utils/xml-helpers.js';

/**
 * Serialize an internal condition body (ByEntityCondition | ByValueCondition)
 * back into the XML object structure expected by fast-xml-parser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildConditionBody(condition: ByEntityCondition | ByValueCondition): any {
  if (condition.kind === 'byEntity') {
    return { ByEntityCondition: buildByEntityCondition(condition) };
  }
  return { ByValueCondition: buildByValueCondition(condition) };
}

// ---------------------------------------------------------------------------
// ByEntityCondition
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildByEntityCondition(c: ByEntityCondition): any {
  return {
    TriggeringEntities: {
      ...buildAttrs({ triggeringEntitiesRule: c.triggeringEntities.triggeringEntitiesRule }),
      EntityRef: c.triggeringEntities.entityRefs.map((ref) =>
        buildAttrs({ entityRef: ref }),
      ),
    },
    EntityCondition: buildEntityCondition(c.entityCondition),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEntityCondition(ec: EntityCondition): any {
  switch (ec.type) {
    case 'distance':
      return { DistanceCondition: buildDistanceCondition(ec) };
    case 'relativeDistance':
      return { RelativeDistanceCondition: buildRelativeDistanceCondition(ec) };
    case 'timeHeadway':
      return { TimeHeadwayCondition: buildTimeHeadwayCondition(ec) };
    case 'timeToCollision':
      return { TimeToCollisionCondition: buildTimeToCollisionCondition(ec) };
    case 'acceleration':
      return { AccelerationCondition: buildAccelerationCondition(ec) };
    case 'speed':
      return { SpeedCondition: buildSpeedCondition(ec) };
    case 'relativeSpeed':
      return { RelativeSpeedCondition: buildRelativeSpeedCondition(ec) };
    case 'reachPosition':
      return { ReachPositionCondition: buildReachPositionCondition(ec) };
    case 'standStill':
      return { StandStillCondition: buildStandStillCondition(ec) };
    case 'traveledDistance':
      return { TraveledDistanceCondition: buildTraveledDistanceCondition(ec) };
    case 'endOfRoad':
      return { EndOfRoadCondition: buildEndOfRoadCondition(ec) };
    case 'collision':
      return { CollisionCondition: buildCollisionCondition(ec) };
    case 'offroad':
      return { OffroadCondition: buildOffroadCondition(ec) };
    case 'relativeClearance':
      return { RelativeClearanceCondition: buildRelativeClearanceCondition(ec) };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDistanceCondition(c: DistanceCondition): any {
  return {
    ...buildAttrs({
      value: c.value,
      freespace: c.freespace,
      coordinateSystem: c.coordinateSystem,
      relativeDistanceType: c.relativeDistanceType,
      rule: c.rule,
    }),
    Position: buildPosition(c.position),
  };
}

function buildRelativeDistanceCondition(c: RelativeDistanceCondition): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    relativeDistanceType: c.relativeDistanceType,
    value: c.value,
    freespace: c.freespace,
    rule: c.rule,
  });
}

function buildTimeHeadwayCondition(c: TimeHeadwayCondition): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    value: c.value,
    freespace: c.freespace,
    rule: c.rule,
    coordinateSystem: c.coordinateSystem,
    alongRoute: c.alongRoute,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimeToCollisionCondition(c: TimeToCollisionCondition): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target: any = {};
  if (c.target.kind === 'entity') {
    target.EntityRef = buildAttrs({ entityRef: c.target.entityRef });
  } else {
    target.Position = buildPosition(c.target.position);
  }

  return {
    ...buildAttrs({
      value: c.value,
      freespace: c.freespace,
      rule: c.rule,
      coordinateSystem: c.coordinateSystem,
      relativeDistanceType: c.relativeDistanceType,
    }),
    TimeToCollisionConditionTarget: target,
  };
}

function buildAccelerationCondition(c: AccelerationCondition): Record<string, string> {
  return buildAttrs({
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  });
}

function buildSpeedCondition(c: SpeedCondition): Record<string, string> {
  return buildAttrs({
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  });
}

function buildRelativeSpeedCondition(c: RelativeSpeedCondition): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReachPositionCondition(c: ReachPositionCondition): any {
  return {
    ...buildAttrs({ tolerance: c.tolerance }),
    Position: buildPosition(c.position),
  };
}

function buildStandStillCondition(c: StandStillCondition): Record<string, string> {
  return buildAttrs({ duration: c.duration });
}

function buildTraveledDistanceCondition(c: TraveledDistanceCondition): Record<string, string> {
  return buildAttrs({ value: c.value });
}

function buildEndOfRoadCondition(c: EndOfRoadCondition): Record<string, string> {
  return buildAttrs({ duration: c.duration });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCollisionCondition(c: CollisionCondition): any {
  if (c.target.kind === 'entity') {
    return { EntityRef: buildAttrs({ entityRef: c.target.entityRef }) };
  }
  return { ByType: buildAttrs({ type: c.target.objectType }) };
}

function buildOffroadCondition(c: OffroadCondition): Record<string, string> {
  return buildAttrs({ duration: c.duration });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRelativeClearanceCondition(c: RelativeClearanceCondition): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({
    distanceForward: c.distanceForward,
    distanceBackward: c.distanceBackward,
    freeSpace: c.freeSpace,
    oppositeLanes: c.oppositeLanes,
  });

  if (c.entityRefs.length > 0) {
    result.EntityRef = c.entityRefs.map((ref) => buildAttrs({ entityRef: ref }));
  }

  if (c.laneRange && c.laneRange.length > 0) {
    result.RelativeLaneRange = c.laneRange.map((lr) =>
      buildAttrs({ from: lr.from, to: lr.to }),
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// ByValueCondition
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildByValueCondition(c: ByValueCondition): any {
  return buildValueCondition(c.valueCondition);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildValueCondition(vc: ValueCondition): any {
  switch (vc.type) {
    case 'simulationTime':
      return { SimulationTimeCondition: buildSimulationTimeCondition(vc) };
    case 'storyboardElementState':
      return { StoryboardElementStateCondition: buildStoryboardElementStateCondition(vc) };
    case 'parameter':
      return { ParameterCondition: buildParameterCondition(vc) };
    case 'variable':
      return { VariableCondition: buildVariableCondition(vc) };
    case 'trafficSignal':
      return { TrafficSignalCondition: buildTrafficSignalCondition(vc) };
    case 'trafficSignalController':
      return { TrafficSignalControllerCondition: buildTrafficSignalControllerCondition(vc) };
    case 'userDefinedValue':
      return { UserDefinedValueCondition: buildUserDefinedValueCondition(vc) };
  }
}

function buildSimulationTimeCondition(c: SimulationTimeCondition): Record<string, string> {
  return buildAttrs({ rule: c.rule, value: c.value });
}

function buildStoryboardElementStateCondition(c: StoryboardElementStateCondition): Record<string, string> {
  return buildAttrs({
    storyboardElementRef: c.storyboardElementRef,
    storyboardElementType: c.storyboardElementType,
    state: c.state,
  });
}

function buildParameterCondition(c: ParameterCondition): Record<string, string> {
  return buildAttrs({
    parameterRef: c.parameterRef,
    value: c.value,
    rule: c.rule,
  });
}

function buildVariableCondition(c: VariableCondition): Record<string, string> {
  return buildAttrs({
    variableRef: c.variableRef,
    value: c.value,
    rule: c.rule,
  });
}

function buildTrafficSignalCondition(c: TrafficSignalCondition): Record<string, string> {
  return buildAttrs({ name: c.name, state: c.state });
}

function buildTrafficSignalControllerCondition(c: TrafficSignalControllerCondition): Record<string, string> {
  return buildAttrs({
    trafficSignalControllerRef: c.trafficSignalControllerRef,
    phase: c.phase,
  });
}

function buildUserDefinedValueCondition(c: UserDefinedValueCondition): Record<string, string> {
  return buildAttrs({ name: c.name, value: c.value, rule: c.rule });
}
