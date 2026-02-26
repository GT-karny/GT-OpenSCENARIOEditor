import type { UseCaseComponent, ComponentParameter } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createBrakeActionObj } from '../helpers/actions.js';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:decelerationToStop.params.egoSpeed.name',
    type: 'number', default: 27.778, min: 0, max: 70, step: 0.5, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:decelerationToStop.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'deceleration', nameKey: 'useCases:decelerationToStop.params.deceleration.name',
    type: 'number', default: 3, min: 0.5, max: 10, step: 0.1, unit: 'm/s²',
    description: 'Deceleration rate',
    descriptionKey: 'useCases:decelerationToStop.params.deceleration.description',
    visualHint: 'slider',
  },
  {
    name: 'triggerTime', nameKey: 'useCases:decelerationToStop.params.triggerTime.name',
    type: 'number', default: 5, min: 0, max: 30, step: 0.5, unit: 's',
    description: 'Simulation time to start deceleration',
    descriptionKey: 'useCases:decelerationToStop.params.triggerTime.description',
    visualHint: 'timeDuration',
  },
];

export const decelerationToStopUseCase: UseCaseComponent = {
  id: 'decelerationToStop',
  name: 'Deceleration to Stop',
  nameKey: 'useCases:decelerationToStop.name',
  description: 'The ego vehicle decelerates to a complete stop',
  descriptionKey: 'useCases:decelerationToStop.description',
  category: 'general',
  icon: 'octagon',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 27.778;
    const deceleration = (params.deceleration as number) ?? 3;
    const triggerTime = (params.triggerTime as number) ?? 5;

    const ego = createDefaultVehicle('Ego');

    const story = createStory('DecelerationStory', [
      createAct('DecelerationAct', [
        createManeuverGroup('EgoManeuverGroup', ['Ego'], [
          createManeuver('DecelerationManeuver', [
            createEvent(
              'DecelerateEvent',
              [createScenarioAction('BrakeAction', createBrakeActionObj(deceleration))],
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
        deceleration: 'BrakeAction.deceleration',
        triggerTime: 'DecelerateEvent.triggerTime',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
