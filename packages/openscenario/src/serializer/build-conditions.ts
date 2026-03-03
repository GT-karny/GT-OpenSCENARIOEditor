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
import { buildAttrs, getSubBindings } from '../utils/xml-helpers.js';

/**
 * Serialize an internal condition body (ByEntityCondition | ByValueCondition)
 * back into the XML object structure expected by fast-xml-parser.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildConditionBody(condition: ByEntityCondition | ByValueCondition, elementBindings: Record<string, string> = {}): any {
  if (condition.kind === 'byEntity') {
    return { ByEntityCondition: buildByEntityCondition(condition, elementBindings) };
  }
  return { ByValueCondition: buildByValueCondition(condition, elementBindings) };
}

// ---------------------------------------------------------------------------
// ByEntityCondition
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildByEntityCondition(c: ByEntityCondition, elementBindings: Record<string, string>): any {
  return {
    TriggeringEntities: {
      ...buildAttrs({ triggeringEntitiesRule: c.triggeringEntities.triggeringEntitiesRule }),
      EntityRef: c.triggeringEntities.entityRefs.map((ref) =>
        buildAttrs({ entityRef: ref }),
      ),
    },
    EntityCondition: buildEntityCondition(c.entityCondition, elementBindings),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEntityCondition(ec: EntityCondition, bindings: Record<string, string>): any {
  switch (ec.type) {
    case 'distance':
      return { DistanceCondition: buildDistanceCondition(ec, bindings) };
    case 'relativeDistance':
      return { RelativeDistanceCondition: buildRelativeDistanceCondition(ec, bindings) };
    case 'timeHeadway':
      return { TimeHeadwayCondition: buildTimeHeadwayCondition(ec, bindings) };
    case 'timeToCollision':
      return { TimeToCollisionCondition: buildTimeToCollisionCondition(ec, bindings) };
    case 'acceleration':
      return { AccelerationCondition: buildAccelerationCondition(ec, bindings) };
    case 'speed':
      return { SpeedCondition: buildSpeedCondition(ec, bindings) };
    case 'relativeSpeed':
      return { RelativeSpeedCondition: buildRelativeSpeedCondition(ec, bindings) };
    case 'reachPosition':
      return { ReachPositionCondition: buildReachPositionCondition(ec, bindings) };
    case 'standStill':
      return { StandStillCondition: buildStandStillCondition(ec, bindings) };
    case 'traveledDistance':
      return { TraveledDistanceCondition: buildTraveledDistanceCondition(ec, bindings) };
    case 'endOfRoad':
      return { EndOfRoadCondition: buildEndOfRoadCondition(ec, bindings) };
    case 'collision':
      return { CollisionCondition: buildCollisionCondition(ec) };
    case 'offroad':
      return { OffroadCondition: buildOffroadCondition(ec, bindings) };
    case 'relativeClearance':
      return { RelativeClearanceCondition: buildRelativeClearanceCondition(ec, bindings) };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDistanceCondition(c: DistanceCondition, bindings: Record<string, string>): any {
  return {
    ...buildAttrs({
      value: c.value,
      freespace: c.freespace,
      coordinateSystem: c.coordinateSystem,
      relativeDistanceType: c.relativeDistanceType,
      rule: c.rule,
    }, bindings),
    Position: buildPosition(c.position, getSubBindings(bindings, 'position')),
  };
}

function buildRelativeDistanceCondition(c: RelativeDistanceCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    relativeDistanceType: c.relativeDistanceType,
    value: c.value,
    freespace: c.freespace,
    rule: c.rule,
  }, bindings);
}

function buildTimeHeadwayCondition(c: TimeHeadwayCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    value: c.value,
    freespace: c.freespace,
    rule: c.rule,
    coordinateSystem: c.coordinateSystem,
    alongRoute: c.alongRoute,
  }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTimeToCollisionCondition(c: TimeToCollisionCondition, bindings: Record<string, string>): any {
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
    }, bindings),
    TimeToCollisionConditionTarget: target,
  };
}

function buildAccelerationCondition(c: AccelerationCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  }, bindings);
}

function buildSpeedCondition(c: SpeedCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  }, bindings);
}

function buildRelativeSpeedCondition(c: RelativeSpeedCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({
    entityRef: c.entityRef,
    value: c.value,
    rule: c.rule,
    direction: c.direction,
  }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildReachPositionCondition(c: ReachPositionCondition, bindings: Record<string, string>): any {
  return {
    ...buildAttrs({ tolerance: c.tolerance }, bindings),
    Position: buildPosition(c.position, getSubBindings(bindings, 'position')),
  };
}

function buildStandStillCondition(c: StandStillCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({ duration: c.duration }, bindings);
}

function buildTraveledDistanceCondition(c: TraveledDistanceCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({ value: c.value }, bindings);
}

function buildEndOfRoadCondition(c: EndOfRoadCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({ duration: c.duration }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCollisionCondition(c: CollisionCondition): any {
  if (c.target.kind === 'entity') {
    return { EntityRef: buildAttrs({ entityRef: c.target.entityRef }) };
  }
  return { ByType: buildAttrs({ type: c.target.objectType }) };
}

function buildOffroadCondition(c: OffroadCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({ duration: c.duration }, bindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRelativeClearanceCondition(c: RelativeClearanceCondition, bindings: Record<string, string>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = buildAttrs({
    distanceForward: c.distanceForward,
    distanceBackward: c.distanceBackward,
    freeSpace: c.freeSpace,
    oppositeLanes: c.oppositeLanes,
  }, bindings);

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
function buildByValueCondition(c: ByValueCondition, elementBindings: Record<string, string>): any {
  return buildValueCondition(c.valueCondition, elementBindings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildValueCondition(vc: ValueCondition, bindings: Record<string, string>): any {
  switch (vc.type) {
    case 'simulationTime':
      return { SimulationTimeCondition: buildSimulationTimeCondition(vc, bindings) };
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

function buildSimulationTimeCondition(c: SimulationTimeCondition, bindings: Record<string, string>): Record<string, string> {
  return buildAttrs({ rule: c.rule, value: c.value }, bindings);
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
