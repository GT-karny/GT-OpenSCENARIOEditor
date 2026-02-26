import type { ActionComponent, ComponentParameter, TeleportAction } from '@osce/shared';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'positionType', nameKey: 'actions:teleportAction.params.positionType.name',
    type: 'enum', default: 'lanePosition', enumValues: ['worldPosition', 'lanePosition'],
    description: 'Type of position specification',
    descriptionKey: 'actions:teleportAction.params.positionType.description',
  },
  {
    name: 'roadId', nameKey: 'actions:teleportAction.params.roadId.name',
    type: 'string', default: '1',
    description: 'Road identifier',
    descriptionKey: 'actions:teleportAction.params.roadId.description',
  },
  {
    name: 'laneId', nameKey: 'actions:teleportAction.params.laneId.name',
    type: 'string', default: '-1',
    description: 'Lane identifier',
    descriptionKey: 'actions:teleportAction.params.laneId.description',
    visualHint: 'laneSelector',
  },
  {
    name: 's', nameKey: 'actions:teleportAction.params.s.name',
    type: 'number', default: 50, min: 0, max: 10000, step: 1, unit: 'm',
    description: 'Position along the road',
    descriptionKey: 'actions:teleportAction.params.s.description',
  },
  {
    name: 'offset', nameKey: 'actions:teleportAction.params.offset.name',
    type: 'number', default: 0, min: -5, max: 5, step: 0.1, unit: 'm',
    description: 'Lateral offset within the lane',
    descriptionKey: 'actions:teleportAction.params.offset.description',
  },
  {
    name: 'worldX', nameKey: 'actions:teleportAction.params.worldX.name',
    type: 'number', default: 0, unit: 'm',
    description: 'X coordinate in world space',
    descriptionKey: 'actions:teleportAction.params.worldX.description',
    visualHint: 'positionPicker',
  },
  {
    name: 'worldY', nameKey: 'actions:teleportAction.params.worldY.name',
    type: 'number', default: 0, unit: 'm',
    description: 'Y coordinate in world space',
    descriptionKey: 'actions:teleportAction.params.worldY.description',
    visualHint: 'positionPicker',
  },
  {
    name: 'worldH', nameKey: 'actions:teleportAction.params.worldH.name',
    type: 'number', default: 0, min: 0, max: 6.283, step: 0.01, unit: 'rad',
    description: 'Heading angle in radians',
    descriptionKey: 'actions:teleportAction.params.worldH.description',
    visualHint: 'angleArc',
  },
];

export const teleportActionComponent: ActionComponent = {
  id: 'teleportAction',
  name: 'Teleport Action',
  nameKey: 'actions:teleportAction.name',
  description: 'Instantly move entity to a position',
  descriptionKey: 'actions:teleportAction.description',
  actionType: 'teleportAction',
  parameters,
  createAction(params) {
    const positionType = (params.positionType as string) ?? 'lanePosition';
    if (positionType === 'worldPosition') {
      return {
        type: 'teleportAction',
        position: {
          type: 'worldPosition',
          x: (params.worldX as number) ?? 0,
          y: (params.worldY as number) ?? 0,
          h: (params.worldH as number) ?? 0,
        },
      } satisfies TeleportAction;
    }
    return {
      type: 'teleportAction',
      position: {
        type: 'lanePosition',
        roadId: (params.roadId as string) ?? '1',
        laneId: (params.laneId as string) ?? '-1',
        s: (params.s as number) ?? 50,
        offset: (params.offset as number) ?? 0,
      },
    } satisfies TeleportAction;
  },
  createDefaultTrigger() {
    return createSimulationTimeTrigger(0);
  },
};
