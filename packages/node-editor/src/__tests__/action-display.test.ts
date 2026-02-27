import { describe, it, expect } from 'vitest';
import { getActionTypeLabel, getPrivateActionSummary, getActionSummary } from '../utils/action-display.js';
import type { PrivateAction } from '@osce/shared';

describe('getActionTypeLabel', () => {
  it('should return label for known action types', () => {
    expect(getActionTypeLabel('speedAction')).toBe('Speed');
    expect(getActionTypeLabel('laneChangeAction')).toBe('Lane Change');
    expect(getActionTypeLabel('teleportAction')).toBe('Teleport');
  });

  it('should return raw type for unknown types', () => {
    expect(getActionTypeLabel('unknownAction')).toBe('unknownAction');
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
