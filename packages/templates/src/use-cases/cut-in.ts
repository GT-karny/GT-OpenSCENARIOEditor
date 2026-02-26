import type { UseCaseComponent, ComponentParameter, DynamicsShape } from '@osce/shared';
import { createDefaultVehicle } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createLaneChangeActionObj } from '../helpers/actions.js';
import { createDistanceTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:cutIn.params.egoSpeed.name',
    type: 'number', default: 27.778, min: 0, max: 70, step: 0.1, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:cutIn.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'cutInSpeed', nameKey: 'useCases:cutIn.params.cutInSpeed.name',
    type: 'number', default: 30.556, min: 0, max: 70, step: 0.1, unit: 'm/s',
    description: 'Speed of the cutting-in vehicle',
    descriptionKey: 'useCases:cutIn.params.cutInSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'triggerDistance', nameKey: 'useCases:cutIn.params.triggerDistance.name',
    type: 'number', default: 20, min: 5, max: 100, step: 1, unit: 'm',
    description: 'Distance at which lane change begins',
    descriptionKey: 'useCases:cutIn.params.triggerDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'laneChangeDistance', nameKey: 'useCases:cutIn.params.laneChangeDistance.name',
    type: 'number', default: 55, min: 10, max: 200, step: 1, unit: 'm',
    description: 'Distance over which lane change occurs',
    descriptionKey: 'useCases:cutIn.params.laneChangeDistance.description',
    visualHint: 'distanceLine',
  },
  {
    name: 'laneChangeDynamicsShape', nameKey: 'useCases:cutIn.params.laneChangeDynamicsShape.name',
    type: 'enum', default: 'cubic', enumValues: ['cubic', 'sinusoidal', 'linear'],
    description: 'Shape of the lane change curve',
    descriptionKey: 'useCases:cutIn.params.laneChangeDynamicsShape.description',
  },
  {
    name: 'cutInSide', nameKey: 'useCases:cutIn.params.cutInSide.name',
    type: 'enum', default: 'left', enumValues: ['left', 'right'],
    description: 'Side from which the vehicle cuts in',
    descriptionKey: 'useCases:cutIn.params.cutInSide.description',
    visualHint: 'laneSelector',
  },
  {
    name: 'egoLaneId', nameKey: 'useCases:cutIn.params.egoLaneId.name',
    type: 'string', default: '-3',
    description: 'Lane in which the ego vehicle travels',
    descriptionKey: 'useCases:cutIn.params.egoLaneId.description',
    visualHint: 'laneSelector',
  },
  {
    name: 'egoStartS', nameKey: 'useCases:cutIn.params.egoStartS.name',
    type: 'number', default: 1000, min: 0, max: 5000, step: 10, unit: 'm',
    description: 'Starting position along the road',
    descriptionKey: 'useCases:cutIn.params.egoStartS.description',
  },
  {
    name: 'cutInRelativeDs', nameKey: 'useCases:cutIn.params.cutInRelativeDs.name',
    type: 'number', default: -100, min: -500, max: 0, step: 10, unit: 'm',
    description: 'Initial longitudinal offset of cut-in vehicle from ego',
    descriptionKey: 'useCases:cutIn.params.cutInRelativeDs.description',
    visualHint: 'distanceLine',
  },
];

export const cutInUseCase: UseCaseComponent = {
  id: 'cutIn',
  name: 'Cut-In',
  nameKey: 'useCases:cutIn.name',
  description: 'A vehicle from an adjacent lane cuts in front of the ego vehicle',
  descriptionKey: 'useCases:cutIn.description',
  category: 'highway',
  icon: 'merge',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 27.778;
    const cutInSpeed = (params.cutInSpeed as number) ?? 30.556;
    const triggerDistance = (params.triggerDistance as number) ?? 20;
    const laneChangeDistance = (params.laneChangeDistance as number) ?? 55;
    const laneChangeDynamicsShape = (params.laneChangeDynamicsShape as DynamicsShape) ?? 'cubic';
    const cutInSide = (params.cutInSide as string) ?? 'left';
    const egoLaneId = (params.egoLaneId as string) ?? '-3';
    const egoStartS = (params.egoStartS as number) ?? 1000;
    const cutInRelativeDs = (params.cutInRelativeDs as number) ?? -100;

    const ego = createDefaultVehicle('Ego');
    const cutInVehicle = createDefaultVehicle('CutInVehicle');

    // CutIn vehicle starts in the adjacent lane
    const dLane = cutInSide === 'left' ? 1 : -1;

    // Lane change action: CutIn vehicle moves to Ego's lane (relative target = 0 to Ego)
    const laneChangeAction = createLaneChangeActionObj(
      0, true, 'Ego',
      laneChangeDynamicsShape, 'distance', laneChangeDistance,
    );

    const story = createStory('CutInStory', [
      createAct('CutInAct', [
        createManeuverGroup('CutInManeuverGroup', ['CutInVehicle'], [
          createManeuver('CutInManeuver', [
            createEvent(
              'CutInEvent',
              [createScenarioAction('LaneChangeAction', laneChangeAction)],
              createDistanceTrigger('CutInVehicle', 'Ego', triggerDistance, 'lessThan'),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego, cutInVehicle],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: '1', laneId: egoLaneId, s: egoStartS, offset: 0 }),
          ],
        },
        {
          entityName: 'CutInVehicle',
          actions: [
            createSpeedActionObj(cutInSpeed),
            createTeleportActionObj({
              type: 'relativeLanePosition',
              entityRef: 'Ego',
              dLane,
              ds: cutInRelativeDs,
            }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        cutInSpeed: 'CutInVehicle.initSpeed',
        triggerDistance: 'CutInEvent.triggerDistance',
        laneChangeDistance: 'LaneChangeAction.dynamicsValue',
        laneChangeDynamicsShape: 'LaneChangeAction.dynamicsShape',
        cutInSide: 'CutInVehicle.dLane',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
