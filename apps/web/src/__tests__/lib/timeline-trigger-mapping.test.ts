import { describe, it, expect } from 'vitest';
import type {
  ScenarioDocument,
  Trigger,
  Condition,
  SimulationTimeCondition,
  SpeedCondition,
} from '@osce/shared';
import { buildTimeTriggerTargets } from '../../lib/timeline-trigger-mapping';

/** Wrap a SimulationTimeCondition in a Condition. */
function timeCondition(id: string, value: number): Condition {
  const inner: SimulationTimeCondition = { type: 'simulationTime', value, rule: 'greaterThan' };
  return {
    id,
    name: id,
    delay: 0,
    conditionEdge: 'rising',
    condition: { kind: 'byValue', valueCondition: inner },
  };
}

/** Wrap a (non-time) SpeedCondition in a Condition. */
function speedCondition(id: string, value: number): Condition {
  const inner: SpeedCondition = { type: 'speed', value, rule: 'greaterThan' };
  return {
    id,
    name: id,
    delay: 0,
    conditionEdge: 'rising',
    condition: {
      kind: 'byEntity',
      triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['Ego'] },
      entityCondition: inner,
    },
  };
}

function trigger(id: string, ...conditions: Condition[]): Trigger {
  return { id, conditionGroups: [{ id: `${id}-g`, conditions }] };
}

/**
 * Build a minimal ScenarioDocument with one story/act/group/maneuver and the
 * given events. Only the fields the mapping reads are populated; the rest is
 * cast through unknown to keep the fixture small.
 */
function makeDoc(events: { id: string; name: string; startTrigger: Trigger }[]): ScenarioDocument {
  const doc = {
    storyboard: {
      stories: [
        {
          id: 'story-1',
          name: 'MyStory',
          acts: [
            {
              id: 'act-1',
              name: 'MyAct',
              startTrigger: trigger('act-trig', timeCondition('act-cond', 0)),
              maneuverGroups: [
                {
                  id: 'group-1',
                  name: 'MyGroup',
                  maneuvers: [
                    {
                      id: 'man-1',
                      name: 'MyManeuver',
                      events: events.map((e) => ({
                        id: e.id,
                        name: e.name,
                        priority: 'parallel',
                        actions: [],
                        startTrigger: e.startTrigger,
                      })),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
  return doc as unknown as ScenarioDocument;
}

describe('buildTimeTriggerTargets', () => {
  it('maps an event with exactly one SimulationTimeCondition', () => {
    const doc = makeDoc([
      { id: 'ev-1', name: 'Cut', startTrigger: trigger('t1', timeCondition('c1', 3.5)) },
    ]);
    const { byElementId, byFullPath } = buildTimeTriggerTargets(doc);

    const target = byElementId.get('ev-1');
    expect(target).toBeDefined();
    expect(target?.conditionId).toBe('c1');
    expect(target?.currentValue).toBe(3.5);
    expect(target?.rule).toBe('greaterThan');
    expect(target?.fullPath).toBe('MyStory::MyAct::MyGroup::MyManeuver::Cut');

    // Same target reachable by fullPath.
    expect(byFullPath.get('MyStory::MyAct::MyGroup::MyManeuver::Cut')).toEqual(target);
  });

  it('skips events with no time condition', () => {
    const doc = makeDoc([
      { id: 'ev-1', name: 'Speedy', startTrigger: trigger('t1', speedCondition('c1', 20)) },
    ]);
    const { byElementId } = buildTimeTriggerTargets(doc);
    expect(byElementId.has('ev-1')).toBe(false);
  });

  it('skips events with more than one time condition (ambiguous)', () => {
    const doc = makeDoc([
      {
        id: 'ev-1',
        name: 'Twice',
        startTrigger: trigger('t1', timeCondition('c1', 1), timeCondition('c2', 2)),
      },
    ]);
    const { byElementId } = buildTimeTriggerTargets(doc);
    expect(byElementId.has('ev-1')).toBe(false);
  });

  it('maps a time condition even when mixed with a non-time condition (still exactly one time)', () => {
    const doc = makeDoc([
      {
        id: 'ev-1',
        name: 'Mixed',
        startTrigger: trigger('t1', speedCondition('c0', 5), timeCondition('c1', 4)),
      },
    ]);
    const { byElementId } = buildTimeTriggerTargets(doc);
    const target = byElementId.get('ev-1');
    expect(target?.conditionId).toBe('c1');
    expect(target?.currentValue).toBe(4);
  });

  it('counts time conditions across separate condition groups', () => {
    const doc = makeDoc([
      {
        id: 'ev-1',
        name: 'TwoGroups',
        startTrigger: {
          id: 't1',
          conditionGroups: [
            { id: 'g1', conditions: [timeCondition('c1', 1)] },
            { id: 'g2', conditions: [timeCondition('c2', 2)] },
          ],
        },
      },
    ]);
    const { byElementId } = buildTimeTriggerTargets(doc);
    expect(byElementId.has('ev-1')).toBe(false);
  });

  it('includes acts with a single time condition', () => {
    const doc = makeDoc([
      { id: 'ev-1', name: 'Speedy', startTrigger: trigger('t1', speedCondition('c1', 20)) },
    ]);
    const { byElementId, byFullPath } = buildTimeTriggerTargets(doc);
    const actTarget = byElementId.get('act-1');
    expect(actTarget?.conditionId).toBe('act-cond');
    expect(actTarget?.currentValue).toBe(0);
    expect(byFullPath.get('MyStory::MyAct')).toEqual(actTarget);
  });
});
