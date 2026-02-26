import type { UseCaseComponent, ComponentParameter, FollowTrajectoryAction, LanePosition } from '@osce/shared';
import { createDefaultVehicle, createDefaultPedestrian } from '../helpers/entities.js';
import { createSpeedActionObj, createTeleportActionObj, createBrakeActionObj } from '../helpers/actions.js';
import { createTimeToCollisionTrigger, createTraveledDistanceTrigger } from '../helpers/triggers.js';
import { createScenarioAction, createEvent, createManeuver, createManeuverGroup, createAct, createStory } from '../helpers/storyboard.js';

const parameters: ComponentParameter[] = [
  {
    name: 'egoSpeed', nameKey: 'useCases:pedestrianCrossing.params.egoSpeed.name',
    type: 'number', default: 10, min: 0, max: 30, step: 0.5, unit: 'm/s',
    description: 'Initial speed of the ego vehicle',
    descriptionKey: 'useCases:pedestrianCrossing.params.egoSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'pedestrianSpeed', nameKey: 'useCases:pedestrianCrossing.params.pedestrianSpeed.name',
    type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1, unit: 'm/s',
    description: 'Walking speed of the pedestrian',
    descriptionKey: 'useCases:pedestrianCrossing.params.pedestrianSpeed.description',
    visualHint: 'speedGauge',
  },
  {
    name: 'brakeDeceleration', nameKey: 'useCases:pedestrianCrossing.params.brakeDeceleration.name',
    type: 'number', default: 5.1, min: 1, max: 10, step: 0.1, unit: 'm/s²',
    description: 'Deceleration rate for emergency braking',
    descriptionKey: 'useCases:pedestrianCrossing.params.brakeDeceleration.description',
    visualHint: 'slider',
  },
  {
    name: 'ttcThreshold', nameKey: 'useCases:pedestrianCrossing.params.ttcThreshold.name',
    type: 'number', default: 1.2, min: 0.5, max: 5, step: 0.1, unit: 's',
    description: 'Time-to-collision threshold to trigger braking',
    descriptionKey: 'useCases:pedestrianCrossing.params.ttcThreshold.description',
    visualHint: 'timeDuration',
  },
  {
    name: 'pedestrianStartSide', nameKey: 'useCases:pedestrianCrossing.params.pedestrianStartSide.name',
    type: 'enum', default: 'right', enumValues: ['left', 'right'],
    description: 'Side from which the pedestrian starts crossing',
    descriptionKey: 'useCases:pedestrianCrossing.params.pedestrianStartSide.description',
  },
  {
    name: 'crossingRoadId', nameKey: 'useCases:pedestrianCrossing.params.crossingRoadId.name',
    type: 'string', default: '0',
    description: 'Road on which the crossing occurs',
    descriptionKey: 'useCases:pedestrianCrossing.params.crossingRoadId.description',
  },
  {
    name: 'crossingS', nameKey: 'useCases:pedestrianCrossing.params.crossingS.name',
    type: 'number', default: 10, min: 0, max: 500, step: 1, unit: 'm',
    description: 'Position along the road where crossing occurs',
    descriptionKey: 'useCases:pedestrianCrossing.params.crossingS.description',
  },
];

export const pedestrianCrossingUseCase: UseCaseComponent = {
  id: 'pedestrianCrossing',
  name: 'Pedestrian Crossing',
  nameKey: 'useCases:pedestrianCrossing.name',
  description: 'A pedestrian crosses the road in front of the ego vehicle',
  descriptionKey: 'useCases:pedestrianCrossing.description',
  category: 'pedestrian',
  icon: 'person-standing',
  parameters,
  decompose(params) {
    const egoSpeed = (params.egoSpeed as number) ?? 10;
    const pedestrianSpeed = (params.pedestrianSpeed as number) ?? 1.5;
    const brakeDeceleration = (params.brakeDeceleration as number) ?? 5.1;
    const ttcThreshold = (params.ttcThreshold as number) ?? 1.2;
    const pedestrianStartSide = (params.pedestrianStartSide as string) ?? 'right';
    const crossingRoadId = (params.crossingRoadId as string) ?? '0';
    const crossingS = (params.crossingS as number) ?? 10;

    const ego = createDefaultVehicle('Ego');
    const pedestrian = createDefaultPedestrian('Pedestrian');

    // Pedestrian starts on sidewalk and crosses the road
    const startLaneId = pedestrianStartSide === 'right' ? '3' : '-3';
    const endLaneId = pedestrianStartSide === 'right' ? '-3' : '3';

    // Build crossing trajectory vertices
    const crossingTrajectory: FollowTrajectoryAction = {
      type: 'followTrajectoryAction',
      trajectory: {
        name: 'PedestrianCrossingTrajectory',
        closed: false,
        shape: {
          type: 'polyline',
          vertices: [
            { position: { type: 'lanePosition', roadId: crossingRoadId, laneId: startLaneId, s: crossingS + 5, offset: 0.5 } as LanePosition },
            { position: { type: 'lanePosition', roadId: crossingRoadId, laneId: startLaneId, s: crossingS, offset: 0 } as LanePosition },
            { position: { type: 'lanePosition', roadId: crossingRoadId, laneId: endLaneId, s: crossingS, offset: 0 } as LanePosition },
            { position: { type: 'lanePosition', roadId: crossingRoadId, laneId: endLaneId, s: crossingS - 2, offset: -0.5 } as LanePosition },
          ],
        },
      },
      timeReference: { none: true },
      followingMode: 'follow',
    };

    const story = createStory('PedestrianCrossingStory', [
      createAct('PedestrianCrossingAct', [
        // ManeuverGroup 1: Pedestrian walks across the road
        createManeuverGroup('PedestrianManeuverGroup', ['Pedestrian'], [
          createManeuver('PedestrianWalkManeuver', [
            createEvent(
              'PedestrianWalkEvent',
              [
                createScenarioAction('WalkSpeedAction', createSpeedActionObj(pedestrianSpeed, 'linear', 'rate', 2)),
                createScenarioAction('WalkRouteAction', crossingTrajectory),
              ],
              createTraveledDistanceTrigger('Ego', 5),
            ),
          ]),
        ]),
        // ManeuverGroup 2: Ego brakes
        createManeuverGroup('EgoBrakeManeuverGroup', ['Ego'], [
          createManeuver('BrakeManeuver', [
            createEvent(
              'BrakeEvent',
              [createScenarioAction('BrakeAction', createBrakeActionObj(brakeDeceleration))],
              createTimeToCollisionTrigger('Ego', 'Pedestrian', ttcThreshold),
            ),
          ]),
        ]),
      ]),
    ]);

    return {
      entities: [ego, pedestrian],
      initActions: [
        {
          entityName: 'Ego',
          actions: [
            createSpeedActionObj(egoSpeed),
            createTeleportActionObj({ type: 'lanePosition', roadId: crossingRoadId, laneId: '1', s: 0, offset: 0 }),
          ],
        },
        {
          entityName: 'Pedestrian',
          actions: [
            createTeleportActionObj({
              type: 'lanePosition',
              roadId: crossingRoadId,
              laneId: startLaneId,
              s: crossingS + 5,
              offset: 0.5,
            }),
          ],
        },
      ],
      stories: [story],
      paramMapping: {
        egoSpeed: 'Ego.initSpeed',
        pedestrianSpeed: 'WalkSpeedAction.targetSpeed',
        brakeDeceleration: 'BrakeAction.deceleration',
        ttcThreshold: 'BrakeEvent.ttcThreshold',
        crossingS: 'PedestrianCrossing.position',
      },
    };
  },
  reconcile(params) {
    return { ...params };
  },
};
