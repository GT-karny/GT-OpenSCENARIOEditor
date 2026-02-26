import type { ActionComponent, ComponentParameter, LongitudinalDistanceAction } from '@osce/shared';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'entityRef', nameKey: 'actions:longitudinalDistanceAction.params.entityRef.name',
    type: 'entityRef', default: '',
    description: 'Entity to maintain distance from',
    descriptionKey: 'actions:longitudinalDistanceAction.params.entityRef.description',
    visualHint: 'entitySelector',
  },
  {
    name: 'distance', nameKey: 'actions:longitudinalDistanceAction.params.distance.name',
    type: 'number', default: 30, min: 0, max: 500, step: 1, unit: 'm',
    description: 'Target longitudinal distance',
    descriptionKey: 'actions:longitudinalDistanceAction.params.distance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'timeGap', nameKey: 'actions:longitudinalDistanceAction.params.timeGap.name',
    type: 'number', default: 1.5, min: 0, max: 10, step: 0.1, unit: 's',
    description: 'Target time gap',
    descriptionKey: 'actions:longitudinalDistanceAction.params.timeGap.description',
    visualHint: 'timeDuration',
  },
  {
    name: 'useTimeGap', nameKey: 'actions:longitudinalDistanceAction.params.useTimeGap.name',
    type: 'boolean', default: false,
    description: 'Use time gap instead of distance',
    descriptionKey: 'actions:longitudinalDistanceAction.params.useTimeGap.description',
  },
  {
    name: 'freespace', nameKey: 'actions:longitudinalDistanceAction.params.freespace.name',
    type: 'boolean', default: false,
    description: 'Whether distance is measured edge-to-edge',
    descriptionKey: 'actions:longitudinalDistanceAction.params.freespace.description',
  },
  {
    name: 'continuous', nameKey: 'actions:longitudinalDistanceAction.params.continuous.name',
    type: 'boolean', default: true,
    description: 'Whether action runs continuously',
    descriptionKey: 'actions:longitudinalDistanceAction.params.continuous.description',
  },
];

export const longitudinalDistanceActionComponent: ActionComponent = {
  id: 'longitudinalDistanceAction',
  name: 'Longitudinal Distance Action',
  nameKey: 'actions:longitudinalDistanceAction.name',
  description: 'Maintain longitudinal distance to a reference entity',
  descriptionKey: 'actions:longitudinalDistanceAction.description',
  actionType: 'longitudinalDistanceAction',
  parameters,
  createAction(params) {
    const useTimeGap = (params.useTimeGap as boolean) ?? false;
    return {
      type: 'longitudinalDistanceAction',
      entityRef: (params.entityRef as string) ?? '',
      distance: useTimeGap ? undefined : ((params.distance as number) ?? 30),
      timeGap: useTimeGap ? ((params.timeGap as number) ?? 1.5) : undefined,
      freespace: (params.freespace as boolean) ?? false,
      continuous: (params.continuous as boolean) ?? true,
    } satisfies LongitudinalDistanceAction;
  },
  createDefaultTrigger() {
    return createSimulationTimeTrigger(0);
  },
};
