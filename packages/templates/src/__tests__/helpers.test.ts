import { describe, it, expect } from 'vitest';
import type {
  Position,
  SpeedAction,
  VehicleDefinition,
  PedestrianDefinition,
} from '@osce/shared';
import {
  generateId,
  createDefaultVehicle,
  createDefaultPedestrian,
  createSpeedActionObj,
  createRelativeSpeedActionObj,
  createBrakeActionObj,
  createLaneChangeActionObj,
  createTeleportActionObj,
  createLongitudinalDistanceActionObj,
  createLateralDistanceActionObj,
  createScenarioAction,
  createEvent,
  createManeuver,
  createManeuverGroup,
  createAct,
  createStory,
  createSimulationTimeTrigger,
  createDistanceTrigger,
  createTimeToCollisionTrigger,
  createTraveledDistanceTrigger,
  createEmptyTrigger,
} from '../index.js';

// A simple, reusable action for wrapping helpers that only store their argument.
const sampleAction: SpeedAction = createSpeedActionObj(10);

describe('generateId', () => {
  it('produces unique, non-empty string ids', () => {
    const ids = Array.from({ length: 1000 }, () => generateId());
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('entity factories', () => {
  it('createDefaultVehicle builds a car vehicle by default', () => {
    const v = createDefaultVehicle('Ego');
    expect(v.id).toBeTruthy();
    expect(v.name).toBe('Ego');
    expect(v.type).toBe('vehicle');
    const def = v.definition as VehicleDefinition;
    expect(def.kind).toBe('vehicle');
    expect(def.name).toBe('Ego');
    expect(def.vehicleCategory).toBe('car');
  });

  it('createDefaultVehicle honors an explicit category', () => {
    const truck = createDefaultVehicle('Truck', 'truck');
    expect((truck.definition as VehicleDefinition).vehicleCategory).toBe('truck');
  });

  it('createDefaultPedestrian builds a pedestrian', () => {
    const p = createDefaultPedestrian('Walker');
    expect(p.id).toBeTruthy();
    expect(p.name).toBe('Walker');
    expect(p.type).toBe('pedestrian');
    const def = p.definition as PedestrianDefinition;
    expect(def.kind).toBe('pedestrian');
    expect(def.name).toBe('Walker');
  });

  it('generates unique ids across calls', () => {
    const ids = [
      createDefaultVehicle('A').id,
      createDefaultVehicle('B').id,
      createDefaultPedestrian('C').id,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('action factories', () => {
  it('createSpeedActionObj builds an absolute speed action', () => {
    const a = createSpeedActionObj(30);
    expect(a.type).toBe('speedAction');
    expect(a.target).toEqual({ kind: 'absolute', value: 30 });
  });

  it('createRelativeSpeedActionObj builds a relative target', () => {
    const a = createRelativeSpeedActionObj('Lead', 5);
    expect(a.type).toBe('speedAction');
    expect(a.target.kind).toBe('relative');
    if (a.target.kind === 'relative') {
      expect(a.target.entityRef).toBe('Lead');
      expect(a.target.value).toBe(5);
    }
  });

  it('createBrakeActionObj decelerates (negative rate) to a full stop', () => {
    const a = createBrakeActionObj(4);
    expect(a.dynamics.dynamicsDimension).toBe('rate');
    expect(a.dynamics.value).toBe(-4);
    expect(a.target).toEqual({ kind: 'absolute', value: 0 });
  });

  it('createLaneChangeActionObj builds relative and absolute targets', () => {
    const rel = createLaneChangeActionObj(1, true, 'Ego');
    expect(rel.type).toBe('laneChangeAction');
    expect(rel.target.kind).toBe('relative');
    if (rel.target.kind === 'relative') expect(rel.target.entityRef).toBe('Ego');

    const abs = createLaneChangeActionObj(2, false, undefined);
    expect(abs.target).toEqual({ kind: 'absolute', value: 2 });
  });

  it('createTeleportActionObj wraps the given position', () => {
    const pos: Position = { type: 'lanePosition', roadId: '1', laneId: '-1', s: 10, offset: 0 };
    const a = createTeleportActionObj(pos);
    expect(a.type).toBe('teleportAction');
    expect(a.position).toBe(pos);
  });

  it('createLongitudinalDistanceActionObj / createLateralDistanceActionObj build distance actions', () => {
    const lon = createLongitudinalDistanceActionObj('Lead', 20);
    expect(lon.type).toBe('longitudinalDistanceAction');
    expect(lon.entityRef).toBe('Lead');
    expect(lon.distance).toBe(20);

    const lat = createLateralDistanceActionObj('Lead', 2);
    expect(lat.type).toBe('lateralDistanceAction');
    expect(lat.entityRef).toBe('Lead');
    expect(lat.distance).toBe(2);
  });
});

describe('storyboard factories', () => {
  const trigger = createSimulationTimeTrigger(0);

  it('createScenarioAction wraps an action with id + name', () => {
    const sa = createScenarioAction('MyAction', sampleAction);
    expect(sa.id).toBeTruthy();
    expect(sa.name).toBe('MyAction');
    expect(sa.action).toBe(sampleAction);
  });

  it('createEvent applies defaults and passes through fields', () => {
    const sa = createScenarioAction('A', sampleAction);
    const ev = createEvent('Evt', [sa], trigger);
    expect(ev.id).toBeTruthy();
    expect(ev.name).toBe('Evt');
    expect(ev.priority).toBe('override');
    expect(ev.maximumExecutionCount).toBe(1);
    expect(ev.actions).toEqual([sa]);
    expect(ev.startTrigger).toBe(trigger);
  });

  it('createEvent honors an explicit priority', () => {
    const ev = createEvent('Evt', [], trigger, 'skip');
    expect(ev.priority).toBe('skip');
  });

  it('createManeuver builds a maneuver', () => {
    const m = createManeuver('Man', []);
    expect(m.id).toBeTruthy();
    expect(m.name).toBe('Man');
    expect(m.parameterDeclarations).toEqual([]);
    expect(m.events).toEqual([]);
  });

  it('createManeuverGroup carries actor refs', () => {
    const mg = createManeuverGroup('MG', ['Ego', 'Lead'], []);
    expect(mg.id).toBeTruthy();
    expect(mg.name).toBe('MG');
    expect(mg.maximumExecutionCount).toBe(1);
    expect(mg.actors.selectTriggeringEntities).toBe(false);
    expect(mg.actors.entityRefs).toEqual(['Ego', 'Lead']);
    expect(mg.maneuvers).toEqual([]);
  });

  it('createAct defaults startTrigger to a simulation-time trigger', () => {
    const act = createAct('Act', []);
    expect(act.id).toBeTruthy();
    expect(act.name).toBe('Act');
    expect(act.maneuverGroups).toEqual([]);
    expect(act.startTrigger).toBeDefined();
    expect(act.startTrigger.conditionGroups.length).toBeGreaterThan(0);
  });

  it('createAct honors an explicit startTrigger', () => {
    const trg = createEmptyTrigger();
    const act = createAct('Act', [], trg);
    expect(act.startTrigger).toBe(trg);
  });

  it('createStory builds a story', () => {
    const s = createStory('Story', []);
    expect(s.id).toBeTruthy();
    expect(s.name).toBe('Story');
    expect(s.parameterDeclarations).toEqual([]);
    expect(s.acts).toEqual([]);
  });

  it('generates unique ids across storyboard factories', () => {
    const ids = [
      createScenarioAction('A', sampleAction).id,
      createEvent('E', [], trigger).id,
      createManeuver('M', []).id,
      createManeuverGroup('MG', [], []).id,
      createAct('Act', []).id,
      createStory('S', []).id,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('trigger factories', () => {
  it('createSimulationTimeTrigger builds a byValue simulationTime condition', () => {
    const t = createSimulationTimeTrigger(5);
    expect(t.id).toBeTruthy();
    expect(t.conditionGroups).toHaveLength(1);
    const cond = t.conditionGroups[0].conditions[0].condition;
    expect(cond.kind).toBe('byValue');
    if (cond.kind === 'byValue' && cond.valueCondition.type === 'simulationTime') {
      expect(cond.valueCondition.value).toBe(5);
    }
  });

  it('createDistanceTrigger builds a byEntity relativeDistance condition', () => {
    const t = createDistanceTrigger('A', 'B', 15, 'lessThan');
    const cond = t.conditionGroups[0].conditions[0].condition;
    expect(cond.kind).toBe('byEntity');
    if (cond.kind === 'byEntity') {
      expect(cond.triggeringEntities.entityRefs).toEqual(['A']);
      expect(cond.entityCondition.type).toBe('relativeDistance');
    }
  });

  it('createTimeToCollisionTrigger targets the given entity', () => {
    const t = createTimeToCollisionTrigger('A', 'B', 2.5);
    const cond = t.conditionGroups[0].conditions[0].condition;
    expect(cond.kind).toBe('byEntity');
    if (cond.kind === 'byEntity') {
      expect(cond.triggeringEntities.entityRefs).toEqual(['A']);
      expect(cond.entityCondition.type).toBe('timeToCollision');
    }
  });

  it('createTraveledDistanceTrigger builds a traveledDistance condition', () => {
    const t = createTraveledDistanceTrigger('A', 100);
    const cond = t.conditionGroups[0].conditions[0].condition;
    expect(cond.kind).toBe('byEntity');
    if (cond.kind === 'byEntity') {
      expect(cond.triggeringEntities.entityRefs).toEqual(['A']);
      expect(cond.entityCondition.type).toBe('traveledDistance');
    }
  });

  it('createEmptyTrigger has an id and no condition groups', () => {
    const t = createEmptyTrigger();
    expect(t.id).toBeTruthy();
    expect(t.conditionGroups).toEqual([]);
  });

  it('generates unique ids for nested trigger elements', () => {
    const t = createSimulationTimeTrigger(0);
    const ids = [
      t.id,
      t.conditionGroups[0].id,
      t.conditionGroups[0].conditions[0].id,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
