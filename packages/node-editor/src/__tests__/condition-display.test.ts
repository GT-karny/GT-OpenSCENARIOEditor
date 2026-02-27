import { describe, it, expect } from 'vitest';
import { getConditionTypeLabel, getConditionSummary, getTriggerSummary } from '../utils/condition-display.js';
import type { Condition, Trigger } from '@osce/shared';

describe('getConditionTypeLabel', () => {
  it('should return label for known types', () => {
    expect(getConditionTypeLabel('simulationTime')).toBe('Simulation Time');
    expect(getConditionTypeLabel('distance')).toBe('Distance');
    expect(getConditionTypeLabel('speed')).toBe('Speed');
  });

  it('should return raw type for unknown types', () => {
    expect(getConditionTypeLabel('unknown')).toBe('unknown');
  });
});

describe('getConditionSummary', () => {
  it('should summarize simulationTime condition', () => {
    const condition: Condition = {
      id: 'c1',
      name: 'test',
      delay: 0,
      conditionEdge: 'rising',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 5, rule: 'greaterThan' },
      },
    };
    expect(getConditionSummary(condition)).toBe('SimTime greaterThan 5s');
  });

  it('should summarize distance condition', () => {
    const condition: Condition = {
      id: 'c2',
      name: 'test',
      delay: 0,
      conditionEdge: 'rising',
      condition: {
        kind: 'byEntity',
        triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['Ego'] },
        entityCondition: {
          type: 'distance',
          value: 20,
          freespace: true,
          rule: 'lessThan',
          position: { type: 'worldPosition', x: 0, y: 0 },
        },
      },
    };
    expect(getConditionSummary(condition)).toBe('Distance lessThan 20m');
  });

  it('should summarize relativeDistance condition', () => {
    const condition: Condition = {
      id: 'c3',
      name: 'test',
      delay: 0,
      conditionEdge: 'rising',
      condition: {
        kind: 'byEntity',
        triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['Ego'] },
        entityCondition: {
          type: 'relativeDistance',
          entityRef: 'Target',
          relativeDistanceType: 'cartesianDistance',
          value: 15,
          freespace: true,
          rule: 'lessThan',
        },
      },
    };
    expect(getConditionSummary(condition)).toBe('RelDist to Target lessThan 15m');
  });
});

describe('getTriggerSummary', () => {
  it('should show "No conditions" for empty trigger', () => {
    const trigger: Trigger = { id: 't1', conditionGroups: [] };
    expect(getTriggerSummary(trigger)).toBe('No conditions');
  });

  it('should show single condition summary', () => {
    const trigger: Trigger = {
      id: 't2',
      conditionGroups: [{
        id: 'g1',
        conditions: [{
          id: 'c1',
          name: 'test',
          delay: 0,
          conditionEdge: 'rising',
          condition: {
            kind: 'byValue',
            valueCondition: { type: 'simulationTime', value: 3, rule: 'greaterThan' },
          },
        }],
      }],
    };
    expect(getTriggerSummary(trigger)).toBe('SimTime greaterThan 3s');
  });

  it('should show count for multiple conditions', () => {
    const trigger: Trigger = {
      id: 't3',
      conditionGroups: [{
        id: 'g1',
        conditions: [
          {
            id: 'c1',
            name: 'a',
            delay: 0,
            conditionEdge: 'rising',
            condition: {
              kind: 'byValue',
              valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
            },
          },
          {
            id: 'c2',
            name: 'b',
            delay: 0,
            conditionEdge: 'rising',
            condition: {
              kind: 'byValue',
              valueCondition: { type: 'simulationTime', value: 5, rule: 'greaterThan' },
            },
          },
        ],
      }],
    };
    expect(getTriggerSummary(trigger)).toBe('2 conditions');
  });
});
