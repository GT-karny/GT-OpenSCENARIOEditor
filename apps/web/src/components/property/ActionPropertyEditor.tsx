import type { ScenarioAction } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { defaultActionByType } from '@osce/scenario-engine';
import {
  PRIVATE_ACTION_TYPES,
  GLOBAL_ACTION_TYPES,
} from '../../constants/osc-enum-values';
import { SpeedActionEditor } from './actions/SpeedActionEditor';
import { LaneChangeActionEditor } from './actions/LaneChangeActionEditor';
import { TeleportActionEditor } from './actions/TeleportActionEditor';
import { LongitudinalDistanceActionEditor } from './actions/LongitudinalDistanceActionEditor';
import { LaneOffsetActionEditor } from './actions/LaneOffsetActionEditor';
import { AcquirePositionActionEditor } from './actions/AcquirePositionActionEditor';
import { ActivateControllerActionEditor } from './actions/ActivateControllerActionEditor';
import { AssignControllerActionEditor } from './actions/AssignControllerActionEditor';
import { FollowTrajectoryActionEditor } from './actions/FollowTrajectoryActionEditor';
import { RoutingActionEditor } from './actions/RoutingActionEditor';
import { VisibilityActionEditor } from './actions/VisibilityActionEditor';
import { ConnectTrailerActionEditor } from './actions/ConnectTrailerActionEditor';
import { DisconnectTrailerActionEditor } from './actions/DisconnectTrailerActionEditor';
import { AnimationActionEditor } from './actions/AnimationActionEditor';
import { LightStateActionEditor } from './actions/LightStateActionEditor';
import { OverrideControllerActionEditor } from './actions/OverrideControllerActionEditor';
import { EntityActionEditor } from './actions/EntityActionEditor';
import { EnvironmentActionEditor } from './actions/EnvironmentActionEditor';
import { TrafficActionEditor } from './actions/TrafficActionEditor';
import { GenericActionEditor } from './actions/GenericActionEditor';

type ActionCategory = 'private' | 'global' | 'userDefined';

function detectCategory(type: string): ActionCategory {
  if ((PRIVATE_ACTION_TYPES as readonly string[]).includes(type)) return 'private';
  if ((GLOBAL_ACTION_TYPES as readonly string[]).includes(type)) return 'global';
  return 'userDefined';
}

const POSITION_BASED_TYPES = [
  'teleportAction',
  'synchronizeAction',
] as const;

const PHASE5_TYPES = [
  'visibilityAction',
  'connectTrailerAction',
  'disconnectTrailerAction',
  'animationAction',
  'lightStateAction',
  'overrideControllerAction',
  'entityAction',
  'environmentAction',
  'trafficAction',
] as const;

interface ActionPropertyEditorProps {
  action: ScenarioAction;
  onUpdate: (actionId: string, partial: Partial<ScenarioAction>) => void;
}

export function ActionPropertyEditor({ action, onUpdate }: ActionPropertyEditorProps) {
  const actionType = action.action.type;
  const category = detectCategory(actionType);

  const typeOptions =
    category === 'private'
      ? [...PRIVATE_ACTION_TYPES]
      : category === 'global'
        ? [...GLOBAL_ACTION_TYPES]
        : ['userDefinedAction'];

  const handleCategoryChange = (newCategory: string) => {
    const firstType =
      newCategory === 'private'
        ? PRIVATE_ACTION_TYPES[0]
        : newCategory === 'global'
          ? GLOBAL_ACTION_TYPES[0]
          : 'userDefinedAction';
    onUpdate(action.id, {
      action: defaultActionByType(firstType),
    } as Partial<ScenarioAction>);
  };

  const handleTypeChange = (newType: string) => {
    onUpdate(action.id, {
      action: defaultActionByType(newType),
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">{action.name}</p>
        <p className="text-xs text-muted-foreground">{actionType}</p>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Name</Label>
        <Input value={action.name} readOnly className="h-8 text-sm bg-muted" />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Category</Label>
        <EnumSelect
          value={category}
          options={['private', 'global', 'userDefined']}
          onValueChange={handleCategoryChange}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Type</Label>
        <EnumSelect
          value={actionType}
          options={typeOptions}
          onValueChange={handleTypeChange}
          className="h-8 text-sm"
        />
      </div>

      <div className="pt-1 border-t">
        {actionType === 'speedAction' && <SpeedActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'laneChangeAction' && <LaneChangeActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'longitudinalDistanceAction' && <LongitudinalDistanceActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'laneOffsetAction' && <LaneOffsetActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'acquirePositionAction' && <AcquirePositionActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'activateControllerAction' && <ActivateControllerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'assignControllerAction' && <AssignControllerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'followTrajectoryAction' && <FollowTrajectoryActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'routingAction' && <RoutingActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {(POSITION_BASED_TYPES as readonly string[]).includes(actionType) && (
          <TeleportActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'visibilityAction' && <VisibilityActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'connectTrailerAction' && <ConnectTrailerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'disconnectTrailerAction' && <DisconnectTrailerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'animationAction' && <AnimationActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'lightStateAction' && <LightStateActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'overrideControllerAction' && <OverrideControllerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'entityAction' && <EntityActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'environmentAction' && <EnvironmentActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType === 'trafficAction' && <TrafficActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />}
        {actionType !== 'speedAction' &&
          actionType !== 'laneChangeAction' &&
          actionType !== 'longitudinalDistanceAction' &&
          actionType !== 'laneOffsetAction' &&
          actionType !== 'acquirePositionAction' &&
          actionType !== 'activateControllerAction' &&
          actionType !== 'assignControllerAction' &&
          actionType !== 'followTrajectoryAction' &&
          actionType !== 'routingAction' &&
          !(POSITION_BASED_TYPES as readonly string[]).includes(actionType) &&
          !(PHASE5_TYPES as readonly string[]).includes(actionType) && (
            <GenericActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
          )}
      </div>
    </div>
  );
}
