import type { UseCaseComponent, ComponentParameter } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createLongitudinalDistanceActionObj } from '../helpers/actions.js';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:followLeadVehicle.params.egoSpeed.name',
    type: 'number', default: 25, min: 0, max: 70, step: 0.5, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:followLeadVehicle.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'leadSpeed', nameKey: 'useCases:followLeadVehicle.params.leadSpeed.name',
    type: 'number', default: 20, min: 0, max: 70, step: 0.5, unit: 'm/s',
    description: 'Speed of the lead vehicle',
    descriptionKey: 'useCases:followLeadVehicle.params.leadSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'followDistance', nameKey: 'useCases:followLeadVehicle.params.followDistance.name',
    type: 'number', default: 30, min: 5, max: 100, step: 1, unit: 'm',
    description: 'Target following distance',
    descriptionKey: 'useCases:followLeadVehicle.params.followDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'timeGap', nameKey: 'useCases:followLeadVehicle.params.timeGap.name',
    type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1, unit: 's',
    description: 'Target time gap',
    descriptionKey: 'useCases:followLeadVehicle.params.timeGap.description',
    visualHint: 'timeDuration',
  },
  {
    name: 'useTimeGap', nameKey: 'useCases:followLeadVehicle.params.useTimeGap.name',
    type: 'boolean', default: false,
    description: 'Use time gap instead of distance',
    descriptionKey: 'useCases:followLeadVehicle.params.useTimeGap.description',
  },
  {
    name: 'initialGap', nameKey: 'useCases:followLeadVehicle.params.initialGap.name',
    type: 'number', default: 100, min: 20, max: 300, step: 10, unit: 'm',
    description: 'Initial distance between vehicles',
    descriptionKey: 'useCases:followLeadVehicle.params.initialGap.description',
    visualHint: 'distanceLine',
  },
];

export const followLeadVehicleUseCase: UseCaseComponent = {
  id: 'followLeadVehicle',
  name: 'Follow Lead Vehicle',
  nameKey: 'useCases:followLeadVehicle.name',
  description: 'The ego vehicle follows a lead vehicle maintaining a specified distance',
  descriptionKey: 'useCases:followLeadVehicle.description',
  category: 'highway',
  icon: 'car',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 25;
    const leadSpeed = (params.leadSpeed as number) ?? 20;
    const followDistance = (params.followDistance as number) ?? 30;
    const timeGap = (params.timeGap as number) ?? 1.5;
    const useTimeGap = (params.useTimeGap as boolean) ?? false;
    const initialGap = (params.initialGap as number) ?? 100;

    const ego = createDefaultVehicle('Ego');
    const leadVehicle = createDefaultVehicle('LeadVehicle');

    const followAction = createLongitudinalDistanceActionObj(
      'LeadVehicle',
      useTimeGap ? undefined : followDistance,
      useTimeGap ? timeGap : undefined,
      false,
      true,
    );

    const story = createStory('FollowLeadVehicleStory', [
      createAct('FollowAct', [
        createManeuverGroup('EgoManeuverGroup', ['Ego'], [
          createManeuver('FollowManeuver', [
            createEvent(
              'FollowEvent',
              [createScenarioAction('FollowAction', followAction)],
              createSimulationTimeTrigger(0),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego, leadVehicle],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-3', s: 50, offset: 0 }),
          ],
        },
        {
          entityName: 'LeadVehicle',
          actions: [
            createSpeedActionObj(leadSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-3', s: 50 + initialGap, offset: 0 }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        leadSpeed: 'LeadVehicle.initSpeed',
        followDistance: 'FollowAction.distance',
        timeGap: 'FollowAction.timeGap',
        initialGap: 'LeadVehicle.initialGap',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
