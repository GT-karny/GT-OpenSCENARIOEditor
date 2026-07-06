import { describe, it, expect } from 'vitest';
import {
  SCENARIO_ACTION_TYPES,
  ENTITY_CONDITION_TYPES,
  VALUE_CONDITION_TYPES,
  POSITION_TYPES,
} from '@osce/shared';
import type {
  ScenarioActionType,
  Position,
  PositionType,
  PrivateAction,
  GlobalAction,
  UserDefinedAction,
  TeleportAction,
  EntityCondition,
  ValueCondition,
  ByEntityCondition,
  ByValueCondition,
  Trigger,
  ScenarioDocument,
} from '@osce/shared';
import { XoscParser, XoscSerializer } from '@osce/openscenario';
import { defaultActionByType } from '../defaults/action-defaults';
import {
  defaultEntityConditionByType,
  defaultValueConditionByType,
} from '../defaults/condition-defaults';
import {
  createDefaultDocument,
  createStoryFromPartial,
  createActFromPartial,
  createManeuverGroupFromPartial,
  createManeuverFromPartial,
  createEventFromPartial,
  createActionFromPartial,
  createConditionFromPartial,
} from '../store/defaults';

// S4-2: parser/serializer exhaustiveness by synthesized round-trip.
//
// For every member of each canonical discriminator list (@osce/shared), synthesize
// a minimal instance from its default, embed it in a minimal scenario document,
// run it through the real XoscSerializer → XoscParser cycle, and assert the parsed
// value matches the synthesized one. Because the loops iterate the canonical
// arrays, a newly added union member automatically gets a case: its default is
// forced by defaultActionByType's exhaustive switch (compile error if missing),
// and a serializer/parser gap surfaces here as a failing identity round-trip.

type ScenarioActionUnion = PrivateAction | GlobalAction | UserDefinedAction;

const parser = new XoscParser();
const serializer = new XoscSerializer();

function firstEvent(doc: ScenarioDocument) {
  return doc.storyboard.stories[0].acts[0].maneuverGroups[0].maneuvers[0].events[0];
}

function docWithAction(action: ScenarioActionUnion): ScenarioDocument {
  const doc = createDefaultDocument();
  const event = createEventFromPartial({ actions: [createActionFromPartial({ action })] });
  const maneuver = createManeuverFromPartial({ events: [event] });
  const maneuverGroup = createManeuverGroupFromPartial({ maneuvers: [maneuver] });
  const act = createActFromPartial({ maneuverGroups: [maneuverGroup] });
  doc.storyboard.stories = [createStoryFromPartial({ acts: [act] })];
  return doc;
}

function roundTripAction(action: ScenarioActionUnion): ScenarioActionUnion {
  const parsed = parser.parse(serializer.serialize(docWithAction(action)));
  return firstEvent(parsed).actions[0].action;
}

function docWithCondition(condition: ByEntityCondition | ByValueCondition): ScenarioDocument {
  const doc = createDefaultDocument();
  const cond = createConditionFromPartial({ condition });
  const trigger: Trigger = { id: 'trig', conditionGroups: [{ id: 'cg', conditions: [cond] }] };
  // A speedAction fills the mandatory Event.Action; the condition under test lives
  // in the Event's StartTrigger and is extracted after the round-trip.
  const event = createEventFromPartial({
    actions: [createActionFromPartial({})],
    startTrigger: trigger,
  });
  const maneuver = createManeuverFromPartial({ events: [event] });
  const maneuverGroup = createManeuverGroupFromPartial({ maneuvers: [maneuver] });
  const act = createActFromPartial({ maneuverGroups: [maneuverGroup] });
  doc.storyboard.stories = [createStoryFromPartial({ acts: [act] })];
  return doc;
}

function roundTripConditionBody(condition: ByEntityCondition | ByValueCondition) {
  const parsed = parser.parse(serializer.serialize(docWithCondition(condition)));
  return firstEvent(parsed).startTrigger.conditionGroups[0].conditions[0].condition;
}

function roundTripEntityCondition(ec: EntityCondition): EntityCondition {
  const body: ByEntityCondition = {
    kind: 'byEntity',
    triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['Ego'] },
    entityCondition: ec,
  };
  return (roundTripConditionBody(body) as ByEntityCondition).entityCondition;
}

function roundTripValueCondition(vc: ValueCondition): ValueCondition {
  const body: ByValueCondition = { kind: 'byValue', valueCondition: vc };
  return (roundTripConditionBody(body) as ByValueCondition).valueCondition;
}

function roundTripPosition(pos: Position): Position {
  return (roundTripAction({ type: 'teleportAction', position: pos }) as TeleportAction).position;
}

// ---------------------------------------------------------------------------
// Action expectations
// ---------------------------------------------------------------------------
//
// Default = strict identity. Two kinds of documented deviation:
//
//  • normalized  — the parse layer canonicalizes the value on the way in, so the
//    round-trip is intentionally not identity. Assert the exact normalized shape
//    (mirrors the acquirePosition special case called out in the S4 design).
//
//  • knownGap    — PRE-EXISTING round-trip gap, NOT introduced by S4. The minimal
//    object from defaultActionByType has every optional field unset, so
//    build-actions.ts serializes it to an EMPTY inner element (e.g.
//    <AssignControllerAction/>, <SetAction/>, <TrafficSignalAction/>). On parse,
//    parse-actions.ts dispatches with child()+truthy, and child() returns
//    undefined for an empty element, so the branch is skipped and the dispatcher
//    throws ("Unknown <X> type" / "element is missing"). i.e. the parser cannot
//    read back the empty element its own serializer emits for a minimal action.
//    Fixing it means teaching each dispatcher to detect presence with has() and
//    tolerate absent attributes — a systemic parser change with identity
//    subtleties (e.g. parameterAction/variableAction 'set' would then parse
//    value:'' vs the default's absent value), out of scope for this test wave and
//    reported as a Wave-J finding. Characterized here as currently-throwing so the
//    suite stays green AND flips (fails) the moment the parser is hardened,
//    prompting removal of the entry. A newly added canonical member with no entry
//    still falls through to the strict identity assertion below.

type ActionExpectation =
  | { kind: 'identity' }
  | { kind: 'normalized'; expected: ScenarioActionUnion; note: string }
  | { kind: 'knownGap'; note: string };

const ACTION_EXPECTATIONS: Partial<Record<ScenarioActionType, ActionExpectation>> = {
  acquirePositionAction: {
    kind: 'normalized',
    note: 'parse-actions.ts parseRoutingAcquirePositionAction canonicalizes a bare AcquirePositionAction to routingAction/acquirePosition',
    expected: {
      type: 'routingAction',
      routeAction: 'acquirePosition',
      position: { type: 'worldPosition', x: 0, y: 0 },
    },
  },
  followTrajectoryAction: {
    kind: 'normalized',
    note: 'parse-actions.ts parseTrajectory always populates trajectory.parameterDeclarations (empty array when absent)',
    expected: {
      type: 'followTrajectoryAction',
      trajectory: {
        name: '',
        closed: false,
        parameterDeclarations: [],
        shape: { type: 'polyline', vertices: [] },
      },
      timeReference: { none: true },
      followingMode: 'position',
    },
  },
  environmentAction: {
    kind: 'normalized',
    note: 'parse-actions.ts parseEnvironment always populates environment.parameterDeclarations (empty array when absent)',
    expected: {
      type: 'environmentAction',
      environment: {
        name: '',
        parameterDeclarations: [],
        timeOfDay: { animation: false, dateTime: '2020-01-01T12:00:00' },
        weather: {},
        roadCondition: { frictionScaleFactor: 1 },
      },
    },
  },
  // knownGap — empty inner element the parser cannot read back (see block comment).
  assignControllerAction: { kind: 'knownGap', note: 'empty <AssignControllerAction/> → "Unknown ControllerAction type"' },
  activateControllerAction: { kind: 'knownGap', note: 'empty <ActivateControllerAction/> → "Unknown ControllerAction type"' },
  overrideControllerAction: { kind: 'knownGap', note: 'empty <OverrideControllerValueAction/> → "Unknown ControllerAction type"' },
  appearanceAction: { kind: 'knownGap', note: 'empty <AppearanceAction/> → "Unknown PrivateAction type"' },
  entityAction: { kind: 'knownGap', note: 'addEntity default has no Position → empty <AddEntityAction/> → "Unknown EntityAction type"' },
  parameterAction: { kind: 'knownGap', note: 'set default has no value → empty <SetAction/> → "Unknown ParameterAction type"' },
  variableAction: { kind: 'knownGap', note: 'set default has no value → empty <SetAction/> → "Unknown VariableAction type"' },
  infrastructureAction: { kind: 'knownGap', note: 'empty trafficSignalAction → empty <TrafficSignalAction/> → "TrafficSignalAction element is missing"' },
  trafficAction: { kind: 'knownGap', note: 'empty <TrafficAction/> → "Unknown GlobalAction type"' },
};

describe('S4-2: action round-trip exhaustiveness over SCENARIO_ACTION_TYPES', () => {
  it('covers exactly the canonical action list', () => {
    // Guards the enumeration itself: the loop below must visit every canonical
    // action and nothing else.
    expect(SCENARIO_ACTION_TYPES.length).toBe(28);
  });

  for (const type of SCENARIO_ACTION_TYPES) {
    const expectation: ActionExpectation = ACTION_EXPECTATIONS[type] ?? { kind: 'identity' };

    if (expectation.kind === 'knownGap') {
      it(`${type} — KNOWN GAP: minimal default currently fails to round-trip (throws)`, () => {
        const synth = defaultActionByType(type);
        expect(() => roundTripAction(synth)).toThrow();
      });
      continue;
    }

    it(`${type} round-trips (${expectation.kind})`, () => {
      const synth = defaultActionByType(type);
      const parsed = roundTripAction(synth);
      expect(parsed).toEqual(expectation.kind === 'normalized' ? expectation.expected : synth);
    });
  }
});

describe('S4-2: entity condition round-trip exhaustiveness over ENTITY_CONDITION_TYPES', () => {
  for (const type of ENTITY_CONDITION_TYPES) {
    it(`${type} round-trips (identity)`, () => {
      const ec = defaultEntityConditionByType(type);
      expect(roundTripEntityCondition(ec)).toEqual(ec);
    });
  }
});

describe('S4-2: value condition round-trip exhaustiveness over VALUE_CONDITION_TYPES', () => {
  for (const type of VALUE_CONDITION_TYPES) {
    it(`${type} round-trips (identity)`, () => {
      const vc = defaultValueConditionByType(type);
      expect(roundTripValueCondition(vc)).toEqual(vc);
    });
  }
});

// No defaultPositionByType exists in scenario-engine, so this fixture map is the
// position analogue of the *ByType defaults. Typed as an exhaustive
// Record<PositionType, Position>: a new Position union member is a compile error
// until a fixture is added here.
const POSITION_FIXTURES: Record<PositionType, Position> = {
  worldPosition: { type: 'worldPosition', x: 1, y: 2, z: 3 },
  lanePosition: { type: 'lanePosition', roadId: '1', laneId: '-1', s: 10, offset: 0.5 },
  relativeLanePosition: { type: 'relativeLanePosition', entityRef: 'Ego', dLane: 1, ds: 2 },
  roadPosition: { type: 'roadPosition', roadId: '1', s: 10, t: 2 },
  relativeRoadPosition: { type: 'relativeRoadPosition', entityRef: 'Ego', ds: 5, dt: 1 },
  relativeObjectPosition: { type: 'relativeObjectPosition', entityRef: 'Ego', dx: 3, dy: 4 },
  relativeWorldPosition: { type: 'relativeWorldPosition', entityRef: 'Ego', dx: 3, dy: 4 },
  routePosition: { type: 'routePosition', routeRef: {}, inRoutePosition: {} },
  geoPosition: { type: 'geoPosition', latitude: 35, longitude: 139 },
  trajectoryPosition: {
    type: 'trajectoryPosition',
    trajectoryRef: { catalogReference: { catalogName: 'C', entryName: 'E' } },
    s: 5,
  },
};

describe('S4-2: position round-trip exhaustiveness over POSITION_TYPES', () => {
  for (const type of POSITION_TYPES) {
    it(`${type} round-trips (identity)`, () => {
      const pos = POSITION_FIXTURES[type];
      expect(roundTripPosition(pos)).toEqual(pos);
    });
  }
});
