import { describe, it, expect } from 'vitest';
import {
  getActionTypeLabel,
  getPrivateActionSummary,
  getGlobalActionSummary,
  getActionSummary,
} from '../utils/action-display.js';
import type { PrivateAction, GlobalAction } from '@osce/shared';

describe('getActionTypeLabel', () => {
  it('should return label for known action types', () => {
    expect(getActionTypeLabel('speedAction')).toBe('Speed');
    expect(getActionTypeLabel('laneChangeAction')).toBe('Lane Change');
    expect(getActionTypeLabel('teleportAction')).toBe('Teleport');
  });

  it('should return raw type for unknown types', () => {
    expect(getActionTypeLabel('unknownAction')).toBe('unknownAction');
  });

  it('should use the canonical Longitudinal Distance label (not Follow Distance)', () => {
    expect(getActionTypeLabel('longitudinalDistanceAction')).toBe('Longitudinal Distance');
  });
});

describe('getPrivateActionSummary', () => {
  it('should summarize speed action', () => {
    const action: PrivateAction = {
      type: 'speedAction',
      dynamics: { dynamicsShape: 'step', dynamicsDimension: 'time', value: 0 },
      target: { kind: 'absolute', value: 30 },
    };
    expect(getPrivateActionSummary(action)).toBe('Speed: 30 m/s, step');
  });

  it('should summarize lane change action', () => {
    const action: PrivateAction = {
      type: 'laneChangeAction',
      dynamics: { dynamicsShape: 'sinusoidal', dynamicsDimension: 'time', value: 3 },
      target: { kind: 'absolute', value: -1 },
    };
    expect(getPrivateActionSummary(action)).toBe('Lane Change: lane -1');
  });

  it('should summarize teleport action', () => {
    const action: PrivateAction = {
      type: 'teleportAction',
      position: { type: 'worldPosition', x: 0, y: 0 },
    };
    expect(getPrivateActionSummary(action)).toBe('Teleport: worldPosition');
  });

  it('should include the controller name for assignControllerAction (ported from web)', () => {
    const action: PrivateAction = {
      type: 'assignControllerAction',
      controller: { name: 'ACC', properties: [] },
    };
    expect(getPrivateActionSummary(action)).toBe('Assign Controller: ACC');
  });

  it('should fall back to a bare label when assignControllerAction has no controller', () => {
    const action: PrivateAction = { type: 'assignControllerAction' };
    expect(getPrivateActionSummary(action)).toBe('Assign Controller');
  });

  it('should resolve bindings for the longitudinal distance summary', () => {
    const action: PrivateAction = {
      type: 'longitudinalDistanceAction',
      entityRef: 'Ego',
      distance: 5,
      freespace: true,
      continuous: false,
    };
    expect(getPrivateActionSummary(action, { 'action.distance': '${$gap}' })).toBe(
      'Long. Dist: $gap to Ego',
    );
  });
});

describe('getGlobalActionSummary', () => {
  it('should show the parameter value (ported from web)', () => {
    const action: GlobalAction = {
      type: 'parameterAction',
      parameterRef: 'speedLimit',
      actionType: 'set',
      value: '30',
    };
    expect(getGlobalActionSummary(action)).toBe('Param: speedLimit = 30');
  });

  it('should show the variable modify value (ported from web)', () => {
    const action: GlobalAction = {
      type: 'variableAction',
      variableRef: 'counter',
      actionType: 'modify',
      rule: 'addValue',
      modifyValue: 2,
    };
    expect(getGlobalActionSummary(action)).toBe('Var: counter = 2');
  });

  it('should resolve bindings for parameter values', () => {
    const action: GlobalAction = {
      type: 'parameterAction',
      parameterRef: 'speedLimit',
      actionType: 'set',
      value: '30',
    };
    expect(getGlobalActionSummary(action, { value: '${$limit}' })).toBe('Param: speedLimit = $limit');
  });
});

describe('getActionSummary', () => {
  it('should handle user defined action', () => {
    const action = { type: 'userDefinedAction' as const, customCommandAction: 'myCommand' };
    expect(getActionSummary(action)).toBe('Custom: myCommand');
  });

  it('should handle global actions', () => {
    const action = {
      type: 'environmentAction' as const,
      environment: {
        name: 'sunny',
        timeOfDay: { animation: false, dateTime: '2023-01-01T12:00:00' },
        weather: {},
        roadCondition: { frictionScaleFactor: 1.0 },
      },
    };
    expect(getActionSummary(action)).toBe('Environment: sunny');
  });
});
