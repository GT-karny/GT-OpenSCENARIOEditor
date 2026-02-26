import type { ActionComponent, ComponentParameter, LateralDistanceAction } from '@osce/shared';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'entityRef', nameKey: 'actions:lateralDistanceAction.params.entityRef.name',
    type: 'entityRef', default: '',
    description: 'Entity to maintain distance from',
    descriptionKey: 'actions:lateralDistanceAction.params.entityRef.description',
    visualHint: 'entitySelector',
  },
  {
    name: 'distance', nameKey: 'actions:lateralDistanceAction.params.distance.name',
    type: 'number', default: 3, min: 0, max: 20, step: 0.1, unit: 'm',
    description: 'Target lateral distance',
    descriptionKey: 'actions:lateralDistanceAction.params.distance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'freespace', nameKey: 'actions:lateralDistanceAction.params.freespace.name',
    type: 'boolean', default: false,
    description: 'Whether distance is measured edge-to-edge',
    descriptionKey: 'actions:lateralDistanceAction.params.freespace.description',
  },
  {
    name: 'continuous', nameKey: 'actions:lateralDistanceAction.params.continuous.name',
    type: 'boolean', default: true,
    description: 'Whether action runs continuously',
    descriptionKey: 'actions:lateralDistanceAction.params.continuous.description',
  },
];

export const lateralDistanceActionComponent: ActionComponent = {
  id: 'lateralDistanceAction',
  name: 'Lateral Distance Action',
  nameKey: 'actions:lateralDistanceAction.name',
  description: 'Maintain lateral distance to a reference entity',
  descriptionKey: 'actions:lateralDistanceAction.description',
  actionType: 'lateralDistanceAction',
  parameters,
  createAction(params) {
    return {
      type: 'lateralDistanceAction',
      entityRef: (params.entityRef as string) ?? '',
      distance: (params.distance as number) ?? 3,
      freespace: (params.freespace as boolean) ?? false,
      continuous: (params.continuous as boolean) ?? true,
    } satisfies LateralDistanceAction;
  },
  createDefaultTrigger() {
    return createSimulationTimeTrigger(0);
  },
};
