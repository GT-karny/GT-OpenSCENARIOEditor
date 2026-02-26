import type { ActionComponent, ComponentParameter, SpeedAction, DynamicsShape, DynamicsDimension } from '@osce/shared';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'targetSpeed', nameKey: 'actions:speedAction.params.targetSpeed.name',
    type: 'number', default: 20, min: 0, max: 100, step: 0.5, unit: 'm/s',
    description: 'Desired speed', descriptionKey: 'actions:speedAction.params.targetSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'dynamicsShape', nameKey: 'actions:speedAction.params.dynamicsShape.name',
    type: 'enum', default: 'step', enumValues: ['cubic', 'linear', 'sinusoidal', 'step'],
    description: 'Shape of the speed transition curve',
    descriptionKey: 'actions:speedAction.params.dynamicsShape.description',
  },
  {
    name: 'dynamicsDimension', nameKey: 'actions:speedAction.params.dynamicsDimension.name',
    type: 'enum', default: 'time', enumValues: ['distance', 'rate', 'time'],
    description: 'How transition value is interpreted',
    descriptionKey: 'actions:speedAction.params.dynamicsDimension.description',
  },
  {
    name: 'dynamicsValue', nameKey: 'actions:speedAction.params.dynamicsValue.name',
    type: 'number', default: 0, min: 0, max: 100, step: 0.1,
    description: 'Transition parameter value',
    descriptionKey: 'actions:speedAction.params.dynamicsValue.description',
    visualHint: 'slider',
  },
];

export const speedActionComponent: ActionComponent = {
  id: 'speedAction',
  name: 'Speed Action',
  nameKey: 'actions:speedAction.name',
  description: 'Change entity speed to a target value',
  descriptionKey: 'actions:speedAction.description',
  actionType: 'speedAction',
  parameters,
  createAction(params) {
    return {
      type: 'speedAction',
      dynamics: {
        dynamicsShape: (params.dynamicsShape as DynamicsShape) ?? 'step',
        dynamicsDimension: (params.dynamicsDimension as DynamicsDimension) ?? 'time',
        value: (params.dynamicsValue as number) ?? 0,
      },
      target: { kind: 'absolute', value: (params.targetSpeed as number) ?? 20 },
    } satisfies SpeedAction;
  },
  createDefaultTrigger() {
    return createSimulationTimeTrigger(0);
  },
};
