import type { ActionComponent, ComponentParameter, LaneChangeAction, DynamicsShape, DynamicsDimension } from '@osce/shared';
import { createSimulationTimeTrigger, createDistanceTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'targetLane', nameKey: 'actions:laneChangeAction.params.targetLane.name',
    type: 'number', default: 1, min: -10, max: 10, step: 1,
    description: 'Target lane (relative or absolute)',
    descriptionKey: 'actions:laneChangeAction.params.targetLane.description',
    visualHint: 'laneSelector',
  },
  {
    name: 'isRelative', nameKey: 'actions:laneChangeAction.params.isRelative.name',
    type: 'boolean', default: true,
    description: 'Whether lane target is relative to current lane',
    descriptionKey: 'actions:laneChangeAction.params.isRelative.description',
  },
  {
    name: 'referenceEntity', nameKey: 'actions:laneChangeAction.params.referenceEntity.name',
    type: 'entityRef', default: '',
    description: 'Entity for relative lane reference',
    descriptionKey: 'actions:laneChangeAction.params.referenceEntity.description',
    visualHint: 'entitySelector',
  },
  {
    name: 'dynamicsShape', nameKey: 'actions:laneChangeAction.params.dynamicsShape.name',
    type: 'enum', default: 'cubic', enumValues: ['cubic', 'linear', 'sinusoidal', 'step'],
    description: 'Shape of the lane change curve',
    descriptionKey: 'actions:laneChangeAction.params.dynamicsShape.description',
  },
  {
    name: 'dynamicsDimension', nameKey: 'actions:laneChangeAction.params.dynamicsDimension.name',
    type: 'enum', default: 'distance', enumValues: ['distance', 'rate', 'time'],
    description: 'How transition value is interpreted',
    descriptionKey: 'actions:laneChangeAction.params.dynamicsDimension.description',
  },
  {
    name: 'dynamicsValue', nameKey: 'actions:laneChangeAction.params.dynamicsValue.name',
    type: 'number', default: 50, min: 1, max: 500, step: 1,
    description: 'Transition parameter value',
    descriptionKey: 'actions:laneChangeAction.params.dynamicsValue.description',
    visualHint: 'slider',
  },
  {
    name: 'targetLaneOffset', nameKey: 'actions:laneChangeAction.params.targetLaneOffset.name',
    type: 'number', default: 0, min: -2, max: 2, step: 0.01, unit: 'm',
    description: 'Lateral offset within target lane',
    descriptionKey: 'actions:laneChangeAction.params.targetLaneOffset.description',
    visualHint: 'slider',
  },
];

export const laneChangeActionComponent: ActionComponent = {
  id: 'laneChangeAction',
  name: 'Lane Change Action',
  nameKey: 'actions:laneChangeAction.name',
  description: 'Change to an adjacent lane',
  descriptionKey: 'actions:laneChangeAction.description',
  actionType: 'laneChangeAction',
  parameters,
  createAction(params) {
    const isRelative = (params.isRelative as boolean) ?? true;
    const refEntity = (params.referenceEntity as string) ?? '';
    return {
      type: 'laneChangeAction',
      dynamics: {
        dynamicsShape: (params.dynamicsShape as DynamicsShape) ?? 'cubic',
        dynamicsDimension: (params.dynamicsDimension as DynamicsDimension) ?? 'distance',
        value: (params.dynamicsValue as number) ?? 50,
      },
      target: isRelative
        ? { kind: 'relative', entityRef: refEntity, value: (params.targetLane as number) ?? 1 }
        : { kind: 'absolute', value: (params.targetLane as number) ?? 1 },
      targetLaneOffset: (params.targetLaneOffset as number) ?? 0,
    } satisfies LaneChangeAction;
  },
  createDefaultTrigger(params) {
    const refEntity = params.referenceEntity as string;
    if (refEntity) {
      return createDistanceTrigger(refEntity, 'Ego', 20, 'lessThan');
    }
    return createSimulationTimeTrigger(0);
  },
};
