/**
 * Human-readable display strings for action types.
 */

import type { PrivateAction, GlobalAction, ScenarioActionType } from '@osce/shared';
import { GLOBAL_ACTION_TYPES } from '@osce/shared';

type ElementBindings = Record<string, string> | undefined;

function rv(value: number | string | undefined | null, field: string, eb: ElementBindings): string {
  const binding = eb?.[field];
  if (binding) {
    return binding.startsWith('${') && binding.endsWith('}') ? binding.slice(2, -1) : binding;
  }
  return String(value ?? '');
}

// Typed as Record<ScenarioActionType, ...>: a new action discriminator that
// lacks a label here (or a stale key that is no longer a discriminator) is a
// compile error.
const actionTypeLabels: Record<ScenarioActionType, string> = {
  speedAction: 'Speed',
  speedProfileAction: 'Speed Profile',
  laneChangeAction: 'Lane Change',
  laneOffsetAction: 'Lane Offset',
  lateralDistanceAction: 'Lateral Distance',
  longitudinalDistanceAction: 'Longitudinal Distance',
  teleportAction: 'Teleport',
  synchronizeAction: 'Synchronize',
  followTrajectoryAction: 'Follow Trajectory',
  acquirePositionAction: 'Acquire Position',
  routingAction: 'Routing',
  assignControllerAction: 'Assign Controller',
  activateControllerAction: 'Activate Controller',
  overrideControllerAction: 'Override Controller',
  visibilityAction: 'Visibility',
  appearanceAction: 'Appearance',
  animationAction: 'Animation',
  lightStateAction: 'Light State',
  connectTrailerAction: 'Connect Trailer',
  disconnectTrailerAction: 'Disconnect Trailer',
  environmentAction: 'Environment',
  entityAction: 'Entity',
  parameterAction: 'Parameter',
  variableAction: 'Variable',
  infrastructureAction: 'Infrastructure',
  trafficAction: 'Traffic',
  userDefinedAction: 'User Defined',
};

export function getActionTypeLabel(actionType: string): string {
  // Tolerant lookup: unknown/legacy discriminators echo back as their raw
  // string. The weld lives on the object literal above, not this read.
  return (actionTypeLabels as Record<string, string | undefined>)[actionType] ?? actionType;
}

export function getPrivateActionSummary(action: PrivateAction, eb?: ElementBindings): string {
  const v = (val: number | string | undefined | null, field: string) => rv(val, field, eb);

  switch (action.type) {
    case 'speedAction': {
      const target = action.target;
      const speed = target.kind === 'absolute' ? `${v(target.value, 'target.value')} m/s` : `relative ${v(target.value, 'target.value')}`;
      return `Speed: ${speed}, ${action.dynamics.dynamicsShape}`;
    }
    case 'laneChangeAction': {
      const target = action.target;
      const lane = target.kind === 'absolute' ? `lane ${v(target.value, 'target.value')}` : `relative ${v(target.value, 'target.value')}`;
      return `Lane Change: ${lane}`;
    }
    case 'teleportAction':
      return `Teleport: ${action.position.type}`;
    case 'longitudinalDistanceAction':
      return `Long. Dist: ${action.distance != null ? v(action.distance, 'action.distance') : action.timeGap != null ? v(action.timeGap, 'action.timeGap') : '?'} to ${action.entityRef}`;
    case 'lateralDistanceAction':
      return `Lat. Dist: ${action.distance != null ? v(action.distance, 'action.distance') : '?'} to ${action.entityRef}`;
    case 'speedProfileAction':
      return `Speed Profile: ${action.entries.length} entries`;
    case 'laneOffsetAction': {
      const t = action.target;
      return `Lane Offset: ${t.kind === 'absolute' ? v(t.value, 'target.value') : `rel ${v(t.value, 'target.value')}`}`;
    }
    case 'synchronizeAction':
      return `Sync with ${action.masterEntityRef}`;
    case 'followTrajectoryAction':
      return `Follow: ${action.trajectory?.name ?? action.trajectoryRef?.entryName ?? 'Trajectory (catalog)'}`;
    case 'acquirePositionAction':
      return `Acquire: ${action.position.type}`;
    case 'routingAction':
      return `Route: ${action.routeAction}`;
    case 'assignControllerAction':
      return action.controller ? `Assign Controller: ${action.controller.name}` : 'Assign Controller';
    case 'activateControllerAction':
      return 'Activate Controller';
    case 'overrideControllerAction':
      return 'Override Controller';
    case 'visibilityAction':
      return `Visibility: gfx=${action.graphics}`;
    case 'appearanceAction':
      return 'Appearance';
    case 'animationAction':
      return `Animation: ${action.animationType}`;
    case 'lightStateAction':
      return `Light: ${action.lightType} ${action.mode}`;
    case 'connectTrailerAction':
      return `Connect: ${action.trailerRef}`;
    case 'disconnectTrailerAction':
      return 'Disconnect Trailer';
  }
}

export function getGlobalActionSummary(action: GlobalAction, eb?: ElementBindings): string {
  const v = (val: number | string | undefined | null, field: string) => rv(val, field, eb);

  switch (action.type) {
    case 'environmentAction':
      return `Environment: ${action.environment?.name ?? action.catalogReference?.entryName ?? ''}`;
    case 'entityAction':
      return `Entity: ${action.actionType} ${action.entityRef}`;
    case 'parameterAction':
      return `Param: ${action.parameterRef} = ${v(action.value ?? action.modifyValue, action.actionType === 'set' ? 'value' : 'modifyValue')}`;
    case 'variableAction':
      return `Var: ${action.variableRef} = ${v(action.value ?? action.modifyValue, action.actionType === 'set' ? 'value' : 'modifyValue')}`;
    case 'infrastructureAction':
      return 'Infrastructure';
    case 'trafficAction':
      return 'Traffic';
  }
}

export function getActionSummary(action: PrivateAction | GlobalAction | { type: 'userDefinedAction'; customCommandAction: string }, eb?: ElementBindings): string {
  if (action.type === 'userDefinedAction') {
    return `Custom: ${(action as { customCommandAction: string }).customCommandAction}`;
  }
  if (isGlobalAction(action.type)) {
    return getGlobalActionSummary(action as GlobalAction, eb);
  }
  return getPrivateActionSummary(action as PrivateAction, eb);
}

function isGlobalAction(type: string): boolean {
  return (GLOBAL_ACTION_TYPES as readonly string[]).includes(type);
}
