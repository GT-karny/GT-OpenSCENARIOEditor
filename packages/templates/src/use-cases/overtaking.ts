import type { UseCaseComponent, ComponentParameter, DynamicsShape } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createLaneChangeActionObj } from '../helpers/actions.js';
import { createDistanceTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:overtaking.params.egoSpeed.name',
    type: 'number', default: 36.111, min: 0, max: 70, step: 0.1, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:overtaking.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'overtakerSpeed', nameKey: 'useCases:overtaking.params.overtakerSpeed.name',
    type: 'number', default: 41.667, min: 0, max: 70, step: 0.1, unit: 'm/s',
    description: 'Speed of the overtaking vehicle',
    descriptionKey: 'useCases:overtaking.params.overtakerSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'approachDistance', nameKey: 'useCases:overtaking.params.approachDistance.name',
    type: 'number', default: 30, min: 5, max: 100, step: 1, unit: 'm',
    description: 'Distance at which overtaking begins',
    descriptionKey: 'useCases:overtaking.params.approachDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'passDistance', nameKey: 'useCases:overtaking.params.passDistance.name',
    type: 'number', default: 5, min: 1, max: 50, step: 1, unit: 'm',
    description: 'Distance ahead after passing to return to lane',
    descriptionKey: 'useCases:overtaking.params.passDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'laneChangeDuration', nameKey: 'useCases:overtaking.params.laneChangeDuration.name',
    type: 'number', default: 5, min: 1, max: 15, step: 0.5, unit: 's',
    description: 'Time for each lane change',
    descriptionKey: 'useCases:overtaking.params.laneChangeDuration.description',
    visualHint: 'timeDuration',
  },
  {
    name: 'dynamicsShape', nameKey: 'useCases:overtaking.params.dynamicsShape.name',
    type: 'enum', default: 'sinusoidal', enumValues: ['sinusoidal', 'cubic', 'linear'],
    description: 'Shape of the lane change curve',
    descriptionKey: 'useCases:overtaking.params.dynamicsShape.description',
  },
  {
    name: 'overtakeSide', nameKey: 'useCases:overtaking.params.overtakeSide.name',
    type: 'enum', default: 'left', enumValues: ['left', 'right'],
    description: 'Side on which overtaking occurs',
    descriptionKey: 'useCases:overtaking.params.overtakeSide.description',
    visualHint: 'laneSelector',
  },
];

export const overtakingUseCase: UseCaseComponent = {
  id: 'overtaking',
  name: 'Overtaking',
  nameKey: 'useCases:overtaking.name',
  description: 'A vehicle overtakes the ego vehicle using the adjacent lane',
  descriptionKey: 'useCases:overtaking.description',
  category: 'highway',
  icon: 'arrow-up-right',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 36.111;
    const overtakerSpeed = (params.overtakerSpeed as number) ?? 41.667;
    const approachDistance = (params.approachDistance as number) ?? 30;
    const passDistance = (params.passDistance as number) ?? 5;
    const laneChangeDuration = (params.laneChangeDuration as number) ?? 5;
    const dynamicsShape = (params.dynamicsShape as DynamicsShape) ?? 'sinusoidal';
    const overtakeSide = (params.overtakeSide as string) ?? 'left';

    const ego = createDefaultVehicle('Ego');
    const overtaker = createDefaultVehicle('Overtaker');

    // Lane offset for overtaking direction
    const laneOffset = overtakeSide === 'left' ? 1 : -1;

    // Event 1: Move to adjacent lane (approach phase)
    const laneChangeLeft = createLaneChangeActionObj(
      laneOffset, true, 'Overtaker',
      dynamicsShape, 'time', laneChangeDuration,
    );

    // Event 2: Return to original lane (after passing)
    const laneChangeRight = createLaneChangeActionObj(
      -laneOffset, true, 'Overtaker',
      dynamicsShape, 'time', laneChangeDuration,
    );

    const story = createStory('OvertakingStory', [
      createAct('OvertakingAct', [
        createManeuverGroup('OvertakerManeuverGroup', ['Overtaker'], [
          createManeuver('OvertakingManeuver', [
            createEvent(
              'LaneChangeOutEvent',
              [createScenarioAction('LaneChangeOutAction', laneChangeLeft)],
              createDistanceTrigger('Overtaker', 'Ego', approachDistance, 'lessThan'),
            ),
            createEvent(
              'LaneChangeBackEvent',
              [createScenarioAction('LaneChangeBackAction', laneChangeRight)],
              createDistanceTrigger('Ego', 'Overtaker', passDistance, 'greaterThan'),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego, overtaker],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-4', s: 60, offset: 0 }),
          ],
        },
        {
          entityName: 'Overtaker',
          actions: [
            createSpeedActionObj(overtakerSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-4', s: 2, offset: 0 }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        overtakerSpeed: 'Overtaker.initSpeed',
        approachDistance: 'LaneChangeOutEvent.triggerDistance',
        passDistance: 'LaneChangeBackEvent.triggerDistance',
        laneChangeDuration: 'LaneChangeAction.dynamicsValue',
        dynamicsShape: 'LaneChangeAction.dynamicsShape',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
