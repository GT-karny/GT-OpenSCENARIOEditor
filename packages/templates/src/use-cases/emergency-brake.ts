import type { UseCaseComponent, ComponentParameter } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createBrakeActionObj } from '../helpers/actions.js';
import { createTimeToCollisionTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:emergencyBrake.params.egoSpeed.name',
    type: 'number', default: 30, min: 0, max: 70, step: 0.5, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:emergencyBrake.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'leadVehicleSpeed', nameKey: 'useCases:emergencyBrake.params.leadVehicleSpeed.name',
    type: 'number', default: 1, min: 0, max: 30, step: 0.5, unit: 'm/s',
    description: 'Speed of the slow lead vehicle',
    descriptionKey: 'useCases:emergencyBrake.params.leadVehicleSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'brakeDeceleration', nameKey: 'useCases:emergencyBrake.params.brakeDeceleration.name',
    type: 'number', default: 6, min: 1, max: 15, step: 0.5, unit: 'm/s²',
    description: 'Deceleration rate for emergency braking',
    descriptionKey: 'useCases:emergencyBrake.params.brakeDeceleration.description',
    visualHint: 'slider',
  },
  {
    name: 'ttcThreshold', nameKey: 'useCases:emergencyBrake.params.ttcThreshold.name',
    type: 'number', default: 2.7, min: 0.5, max: 10, step: 0.1, unit: 's',
    description: 'Time-to-collision threshold to trigger braking',
    descriptionKey: 'useCases:emergencyBrake.params.ttcThreshold.description',
    visualHint: 'timeDuration',
  },
  {
    name: 'initialGap', nameKey: 'useCases:emergencyBrake.params.initialGap.name',
    type: 'number', default: 150, min: 20, max: 500, step: 10, unit: 'm',
    description: 'Initial distance between ego and lead vehicle',
    descriptionKey: 'useCases:emergencyBrake.params.initialGap.description',
    visualHint: 'distanceLine',
  },
];

export const emergencyBrakeUseCase: UseCaseComponent = {
  id: 'emergencyBrake',
  name: 'Emergency Brake',
  nameKey: 'useCases:emergencyBrake.name',
  description: 'The ego vehicle performs emergency braking to avoid a slow lead vehicle',
  descriptionKey: 'useCases:emergencyBrake.description',
  category: 'highway',
  icon: 'alert-triangle',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 30;
    const leadVehicleSpeed = (params.leadVehicleSpeed as number) ?? 1;
    const brakeDeceleration = (params.brakeDeceleration as number) ?? 6;
    const ttcThreshold = (params.ttcThreshold as number) ?? 2.7;
    const initialGap = (params.initialGap as number) ?? 150;

    const ego = createDefaultVehicle('Ego');
    const leadVehicle = createDefaultVehicle('LeadVehicle');

    const story = createStory('EmergencyBrakeStory', [
      createAct('EmergencyBrakeAct', [
        createManeuverGroup('EgoManeuverGroup', ['Ego'], [
          createManeuver('BrakeManeuver', [
            createEvent(
              'BrakeEvent',
              [createScenarioAction('BrakeAction', createBrakeActionObj(brakeDeceleration))],
              createTimeToCollisionTrigger('Ego', 'LeadVehicle', ttcThreshold),
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
            createSpeedActionObj(leadVehicleSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-3', s: 50 + initialGap, offset: 0 }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        leadVehicleSpeed: 'LeadVehicle.initSpeed',
        brakeDeceleration: 'BrakeAction.deceleration',
        ttcThreshold: 'BrakeEvent.ttcThreshold',
        initialGap: 'LeadVehicle.initialGap',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
