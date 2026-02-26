import type { ActionComponent, ComponentParameter, FollowTrajectoryAction, FollowingMode } from '@osce/shared';
import { createSimulationTimeTrigger } from '../helpers/triggers.js';

const parameters: ComponentParameter[] = [
  {
    name: 'trajectoryName', nameKey: 'actions:followTrajectoryAction.params.trajectoryName.name',
    type: 'string', default: 'Trajectory1',
    description: 'Name of the trajectory',
    descriptionKey: 'actions:followTrajectoryAction.params.trajectoryName.description',
  },
  {
    name: 'closed', nameKey: 'actions:followTrajectoryAction.params.closed.name',
    type: 'boolean', default: false,
    description: 'Whether trajectory forms a closed loop',
    descriptionKey: 'actions:followTrajectoryAction.params.closed.description',
  },
  {
    name: 'followingMode', nameKey: 'actions:followTrajectoryAction.params.followingMode.name',
    type: 'enum', default: 'follow', enumValues: ['follow', 'position'],
    description: 'How the entity follows the trajectory',
    descriptionKey: 'actions:followTrajectoryAction.params.followingMode.description',
  },
  {
    name: 'useTimingReference', nameKey: 'actions:followTrajectoryAction.params.useTimingReference.name',
    type: 'boolean', default: false,
    description: 'Whether to use timing reference',
    descriptionKey: 'actions:followTrajectoryAction.params.useTimingReference.description',
  },
];

export const followTrajectoryActionComponent: ActionComponent = {
  id: 'followTrajectoryAction',
  name: 'Follow Trajectory Action',
  nameKey: 'actions:followTrajectoryAction.name',
  description: 'Follow a predefined trajectory path',
  descriptionKey: 'actions:followTrajectoryAction.description',
  actionType: 'followTrajectoryAction',
  parameters,
  createAction(params) {
    return {
      type: 'followTrajectoryAction',
      trajectory: {
        name: (params.trajectoryName as string) ?? 'Trajectory1',
        closed: (params.closed as boolean) ?? false,
        shape: { type: 'polyline', vertices: [] },
      },
      timeReference: { none: true },
      followingMode: (params.followingMode as FollowingMode) ?? 'follow',
    } satisfies FollowTrajectoryAction;
  },
  createDefaultTrigger() {
    return createSimulationTimeTrigger(0);
  },
};
