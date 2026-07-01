import { describe, it, expect } from 'vitest';
import type {
  SpeedAction,
  ByEntityCondition,
  AccelerationCondition,
  ByValueCondition,
  SimulationTimeCondition,
} from '@osce/shared';
import {
  actionReplace,
  actionUpdate,
  actionBody,
  conditionReplace,
  entityConditionUpdate,
  entityConditionReplace,
  valueConditionUpdate,
  valueConditionReplace,
  triggeringEntitiesUpdate,
  isByEntity,
  isByValue,
} from '../../components/property/lib/typed-updates';

describe('typed-updates: action helpers', () => {
  const speed: SpeedAction = {
    type: 'speedAction',
    dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
    target: { kind: 'absolute', value: 10 },
  };

  it('actionUpdate merges updates onto the inner body under `action`', () => {
    const result = actionUpdate(speed, { target: { kind: 'absolute', value: 25 } });
    expect(result).toEqual({
      action: {
        type: 'speedAction',
        dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
        target: { kind: 'absolute', value: 25 },
      },
    });
    // Source body is not mutated.
    expect(speed.target).toEqual({ kind: 'absolute', value: 10 });
  });

  it('actionReplace wraps a fresh body verbatim', () => {
    expect(actionReplace(speed)).toEqual({ action: speed });
  });

  it('actionBody wraps an already-derived body verbatim', () => {
    const { dynamics: _omit, ...rest } = speed;
    expect(actionBody({ ...rest, dynamics: speed.dynamics })).toEqual({ action: speed });
  });
});

describe('typed-updates: entity condition helpers', () => {
  const inner: ByEntityCondition = {
    kind: 'byEntity',
    triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['ego'] },
    entityCondition: { type: 'acceleration', value: 3, rule: 'greaterThan' },
  };
  const cond = inner.entityCondition as AccelerationCondition;

  it('entityConditionUpdate merges onto entityCondition, keeping triggeringEntities', () => {
    const result = entityConditionUpdate(inner, cond, { value: 5, direction: 'lateral' });
    expect(result).toEqual({
      condition: {
        kind: 'byEntity',
        triggeringEntities: { triggeringEntitiesRule: 'any', entityRefs: ['ego'] },
        entityCondition: {
          type: 'acceleration',
          value: 5,
          rule: 'greaterThan',
          direction: 'lateral',
        },
      },
    });
  });

  it('entityConditionReplace swaps the entityCondition body', () => {
    const { direction: _omit, ...rest } = { ...cond, direction: 'vertical' as const };
    const result = entityConditionReplace(inner, rest as AccelerationCondition);
    expect(result.condition).toMatchObject({ kind: 'byEntity' });
    if (result.condition?.kind === 'byEntity') {
      expect(result.condition.entityCondition).toEqual({
        type: 'acceleration',
        value: 3,
        rule: 'greaterThan',
      });
    }
  });

  it('triggeringEntitiesUpdate patches only triggeringEntities', () => {
    const result = triggeringEntitiesUpdate(inner, { triggeringEntitiesRule: 'all' });
    if (result.condition?.kind === 'byEntity') {
      expect(result.condition.triggeringEntities.triggeringEntitiesRule).toBe('all');
      expect(result.condition.triggeringEntities.entityRefs).toEqual(['ego']);
      // entityCondition is preserved untouched.
      expect(result.condition.entityCondition).toEqual(cond);
    }
  });
});

describe('typed-updates: value condition helpers', () => {
  const inner: ByValueCondition = {
    kind: 'byValue',
    valueCondition: { type: 'simulationTime', value: 1, rule: 'greaterThan' },
  };
  const cond = inner.valueCondition as SimulationTimeCondition;

  it('valueConditionUpdate merges onto valueCondition', () => {
    const result = valueConditionUpdate(inner, cond, { value: 9 });
    expect(result).toEqual({
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 9, rule: 'greaterThan' },
      },
    });
  });

  it('valueConditionReplace swaps the valueCondition body', () => {
    const next: SimulationTimeCondition = { type: 'simulationTime', value: 42, rule: 'lessThan' };
    expect(valueConditionReplace(inner, next)).toEqual({
      condition: { kind: 'byValue', valueCondition: next },
    });
  });

  it('conditionReplace wraps a fresh condition body', () => {
    expect(conditionReplace(inner)).toEqual({ condition: inner });
  });
});

describe('typed-updates: narrowing guards', () => {
  const entity = {
    id: 'c1',
    name: '',
    delay: 0,
    conditionEdge: 'rising' as const,
    condition: {
      kind: 'byEntity' as const,
      triggeringEntities: { triggeringEntitiesRule: 'any' as const, entityRefs: [] },
      entityCondition: { type: 'standStill' as const, duration: 1 },
    },
  };
  const value = {
    id: 'c2',
    name: '',
    delay: 0,
    conditionEdge: 'rising' as const,
    condition: {
      kind: 'byValue' as const,
      valueCondition: { type: 'simulationTime' as const, value: 1, rule: 'greaterThan' as const },
    },
  };

  it('isByEntity / isByValue discriminate correctly', () => {
    expect(isByEntity(entity)).toBe(true);
    expect(isByValue(entity)).toBe(false);
    expect(isByValue(value)).toBe(true);
    expect(isByEntity(value)).toBe(false);
  });
});
