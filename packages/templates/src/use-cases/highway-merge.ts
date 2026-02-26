import type { UseCaseComponent, ComponentParameter, DynamicsShape } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createLaneChangeActionObj } from '../helpers/actions.js';
import { createDistanceTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:highwayMerge.params.egoSpeed.name',
    type: 'number', default: 27.778, min: 0, max: 40, step: 0.5, unit: 'm/s',
    description: 'Speed of the ego vehicle on the main road',
    descriptionKey: 'useCases:highwayMerge.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'mergeVehicleSpeed', nameKey: 'useCases:highwayMerge.params.mergeVehicleSpeed.name',
    type: 'number', default: 22, min: 0, max: 40, step: 0.5, unit: 'm/s',
    description: 'Speed of the merging vehicle',
    descriptionKey: 'useCases:highwayMerge.params.mergeVehicleSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'mergeDistance', nameKey: 'useCases:highwayMerge.params.mergeDistance.name',
    type: 'number', default: 40, min: 10, max: 200, step: 5, unit: 'm',
    description: 'Distance over which the merge occurs',
    descriptionKey: 'useCases:highwayMerge.params.mergeDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'triggerDistance', nameKey: 'useCases:highwayMerge.params.triggerDistance.name',
    type: 'number', default: 50, min: 10, max: 200, step: 5, unit: 'm',
    description: 'Distance at which merge begins',
    descriptionKey: 'useCases:highwayMerge.params.triggerDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'dynamicsShape', nameKey: 'useCases:highwayMerge.params.dynamicsShape.name',
    type: 'enum', default: 'sinusoidal', enumValues: ['sinusoidal', 'cubic', 'linear'],
    description: 'Shape of the merge curve',
    descriptionKey: 'useCases:highwayMerge.params.dynamicsShape.description',
  },
];

export const highwayMergeUseCase: UseCaseComponent = {
  id: 'highwayMerge',
  name: 'Highway Merge',
  nameKey: 'useCases:highwayMerge.name',
  description: 'A vehicle merges onto the highway from an adjacent lane',
  descriptionKey: 'useCases:highwayMerge.description',
  category: 'highway',
  icon: 'git-merge',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 27.778;
    const mergeVehicleSpeed = (params.mergeVehicleSpeed as number) ?? 22;
    const mergeDistance = (params.mergeDistance as number) ?? 40;
    const triggerDistance = (params.triggerDistance as number) ?? 50;
    const dynamicsShape = (params.dynamicsShape as DynamicsShape) ?? 'sinusoidal';

    const ego = createDefaultVehicle('Ego');
    const mergeVehicle = createDefaultVehicle('MergeVehicle');

    // Merge vehicle changes lane towards Ego's lane
    const laneChangeAction = createLaneChangeActionObj(
      0, true, 'Ego',
      dynamicsShape, 'distance', mergeDistance,
    );

    const story = createStory('HighwayMergeStory', [
      createAct('MergeAct', [
        createManeuverGroup('MergeManeuverGroup', ['MergeVehicle'], [
          createManeuver('MergeManeuver', [
            createEvent(
              'MergeEvent',
              [createScenarioAction('MergeLaneChangeAction', laneChangeAction)],
              createDistanceTrigger('MergeVehicle', 'Ego', triggerDistance, 'lessThan'),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego, mergeVehicle],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-3', s: 100, offset: 0 }),
          ],
        },
        {
          entityName: 'MergeVehicle',
          actions: [
            createSpeedActionObj(mergeVehicleSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: '-2', s: 50, offset: 0 }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        mergeVehicleSpeed: 'MergeVehicle.initSpeed',
        mergeDistance: 'MergeLaneChangeAction.dynamicsValue',
        triggerDistance: 'MergeEvent.triggerDistance',
        dynamicsShape: 'MergeLaneChangeAction.dynamicsShape',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
