import type { UseCaseComponent, ComponentParameter, DynamicsShape, DynamicsDimension } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createLaneChangeActionObj } from '../helpers/actions.js';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:laneChange.params.egoSpeed.name',
    type: 'number', default: 20, min: 0, max: 70, step: 0.5, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:laneChange.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'targetLane', nameKey: 'useCases:laneChange.params.targetLane.name',
    type: 'number', default: 1, min: -5, max: 5, step: 1,
    description: 'Target lane (relative offset)',
    descriptionKey: 'useCases:laneChange.params.targetLane.description',
    visualHint: 'laneSelector',
  },
  {
    name: 'isRelative', nameKey: 'useCases:laneChange.params.isRelative.name',
    type: 'boolean', default: true,
    description: 'Whether lane target is relative',
    descriptionKey: 'useCases:laneChange.params.isRelative.description',
  },
  {
    name: 'dynamicsShape', nameKey: 'useCases:laneChange.params.dynamicsShape.name',
    type: 'enum', default: 'sinusoidal', enumValues: ['cubic', 'sinusoidal', 'linear', 'step'],
    description: 'Shape of the lane change curve',
    descriptionKey: 'useCases:laneChange.params.dynamicsShape.description',
  },
  {
    name: 'dynamicsDimension', nameKey: 'useCases:laneChange.params.dynamicsDimension.name',
    type: 'enum', default: 'time', enumValues: ['time', 'distance', 'rate'],
    description: 'How transition value is interpreted',
    descriptionKey: 'useCases:laneChange.params.dynamicsDimension.description',
  },
  {
    name: 'dynamicsValue', nameKey: 'useCases:laneChange.params.dynamicsValue.name',
    type: 'number', default: 2, min: 0.5, max: 15, step: 0.5,
    description: 'Transition parameter value',
    descriptionKey: 'useCases:laneChange.params.dynamicsValue.description',
    visualHint: 'slider',
  },
  {
    name: 'triggerTime', nameKey: 'useCases:laneChange.params.triggerTime.name',
    type: 'number', default: 4, min: 0, max: 30, step: 0.5, unit: 's',
    description: 'Simulation time to start lane change',
    descriptionKey: 'useCases:laneChange.params.triggerTime.description',
    visualHint: 'timeDuration',
  },
];

export const laneChangeUseCase: UseCaseComponent = {
  id: 'laneChange',
  name: 'Lane Change',
  nameKey: 'useCases:laneChange.name',
  description: 'The ego vehicle performs a lane change maneuver',
  descriptionKey: 'useCases:laneChange.description',
  category: 'general',
  icon: 'arrow-right-left',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 20;
    const targetLane = (params.targetLane as number) ?? 1;
    const isRelative = (params.isRelative as boolean) ?? true;
    const dynamicsShape = (params.dynamicsShape as DynamicsShape) ?? 'sinusoidal';
    const dynamicsDimension = (params.dynamicsDimension as DynamicsDimension) ?? 'time';
    const dynamicsValue = (params.dynamicsValue as number) ?? 2;
    const triggerTime = (params.triggerTime as number) ?? 4;

    const ego = createDefaultVehicle('Ego');

    const laneChangeAction = createLaneChangeActionObj(
      targetLane, isRelative, isRelative ? 'Ego' : undefined,
      dynamicsShape, dynamicsDimension, dynamicsValue,
    );

    const story = createStory('LaneChangeStory', [
      createAct('LaneChangeAct', [
        createManeuverGroup('EgoManeuverGroup', ['Ego'], [
          createManeuver('LaneChangeManeuver', [
            createEvent(
              'LaneChangeEvent',
              [createScenarioAction('LaneChangeAction', laneChangeAction)],
              createSimulationTimeTrigger(triggerTime),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-3', s: 50, offset: 0 }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        targetLane: 'LaneChangeAction.targetLane',
        dynamicsValue: 'LaneChangeAction.dynamicsValue',
        triggerTime: 'LaneChangeEvent.triggerTime',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
