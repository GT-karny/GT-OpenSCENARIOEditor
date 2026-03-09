import { useMemo } from 'react';
import type { ScenarioAction } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Car, Globe, Wrench } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { defaultActionByType } from '@osce/scenario-engine';
import {
  PRIVATE_ACTION_TYPES,
  GLOBAL_ACTION_TYPES,
  PRIVATE_ACTION_SUBCATEGORIES,
  GLOBAL_ACTION_ORDER,
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
import { InfrastructureActionEditor } from './actions/InfrastructureActionEditor';
import { GenericActionEditor } from './actions/GenericActionEditor';
import { cn } from '@/lib/utils';

type ActionCategory = 'private' | 'global' | 'userDefined';

function detectCategory(type: string): ActionCategory {
  if ((PRIVATE_ACTION_TYPES as readonly string[]).includes(type)) return 'private';
  if ((GLOBAL_ACTION_TYPES as readonly string[]).includes(type)) return 'global';
  return 'userDefined';
}

function detectSubcategory(type: string): string {
  for (const sub of PRIVATE_ACTION_SUBCATEGORIES) {
    if ((sub.types as readonly string[]).includes(type)) return sub.key;
  }
  return PRIVATE_ACTION_SUBCATEGORIES[0].key;
}

const CATEGORY_SEGMENTS = [
  { key: 'private' as const, icon: Car },
  { key: 'global' as const, icon: Globe },
  { key: 'userDefined' as const, icon: Wrench },
] as const;

const POSITION_BASED_TYPES = ['teleportAction', 'synchronizeAction'] as const;

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
  'infrastructureAction',
] as const;

interface ActionPropertyEditorProps {
  action: ScenarioAction;
  onUpdate: (actionId: string, partial: Partial<ScenarioAction>) => void;
}

export function ActionPropertyEditor({ action, onUpdate }: ActionPropertyEditorProps) {
  const { t } = useTranslation('openscenario');
  const actionType = action.action.type;
  const category = detectCategory(actionType);
  const subcategory = category === 'private' ? detectSubcategory(actionType) : null;

  const typeList = useMemo(() => {
    if (category === 'private' && subcategory) {
      const sub = PRIVATE_ACTION_SUBCATEGORIES.find((s) => s.key === subcategory);
      return sub ? [...sub.types] : [];
    }
    if (category === 'global') return [...GLOBAL_ACTION_ORDER];
    return ['userDefinedAction'];
  }, [category, subcategory]);

  const handleCategoryChange = (newCategory: ActionCategory) => {
    if (newCategory === category) return;
    const firstType =
      newCategory === 'private'
        ? PRIVATE_ACTION_SUBCATEGORIES[0].types[0]
        : newCategory === 'global'
          ? GLOBAL_ACTION_ORDER[0]
          : 'userDefinedAction';
    onUpdate(action.id, {
      action: defaultActionByType(firstType),
    } as Partial<ScenarioAction>);
  };

  const handleSubcategoryChange = (newSubKey: string) => {
    if (newSubKey === subcategory) return;
    const sub = PRIVATE_ACTION_SUBCATEGORIES.find((s) => s.key === newSubKey);
    if (sub) {
      onUpdate(action.id, {
        action: defaultActionByType(sub.types[0]),
      } as Partial<ScenarioAction>);
    }
  };

  const handleTypeChange = (newType: string) => {
    if (newType === actionType) return;
    onUpdate(action.id, {
      action: defaultActionByType(newType),
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">{action.name}</p>
        <p className="text-xs text-muted-foreground">
          {t(`actionTypes.${actionType}` as never)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Name</Label>
        <Input value={action.name} readOnly className="h-8 text-sm bg-muted" />
      </div>

      {/* Category — Segmented Control */}
      <div className="grid gap-1.5">
        <Label className="text-xs">Category</Label>
        <div className="flex gap-0.5 p-0.5 bg-muted">
          {CATEGORY_SEGMENTS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryChange(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all',
                category === key
                  ? 'glass-item selected'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
              )}
            >
              <Icon className="size-3.5" />
              {t(`actionCategories.${key}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Tabs — Private only */}
      {category === 'private' && (
        <div className="grid gap-1.5">
          <Label className="text-xs">Subcategory</Label>
          <div className="flex flex-wrap gap-0.5">
            {PRIVATE_ACTION_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => handleSubcategoryChange(sub.key)}
                className={cn(
                  'px-2 py-1 text-xs transition-all',
                  subcategory === sub.key
                    ? 'glass-item selected'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-[var(--color-glass-edge-mid)]',
                )}
              >
                {t(`actionSubcategories.${sub.key}` as never)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type list */}
      {category !== 'userDefined' && (
        <div className="grid gap-1.5">
          <Label className="text-xs">Type</Label>
          <div className="mx-4 flex flex-col divide-y divide-border border border-border bg-[var(--color-glass-1)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
            {typeList.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={cn(
                  'px-3 py-1.5 text-left text-xs transition-all',
                  actionType === type
                    ? 'glass-item selected font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {t(`actionTypes.${type}` as never)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type-specific editor */}
      <div className="pt-1 border-t">
        {actionType === 'speedAction' && (
          <SpeedActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'laneChangeAction' && (
          <LaneChangeActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'longitudinalDistanceAction' && (
          <LongitudinalDistanceActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'laneOffsetAction' && (
          <LaneOffsetActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'acquirePositionAction' && (
          <AcquirePositionActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'activateControllerAction' && (
          <ActivateControllerActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'assignControllerAction' && (
          <AssignControllerActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'followTrajectoryAction' && (
          <FollowTrajectoryActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'routingAction' && (
          <RoutingActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {(POSITION_BASED_TYPES as readonly string[]).includes(actionType) && (
          <TeleportActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'visibilityAction' && (
          <VisibilityActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'connectTrailerAction' && (
          <ConnectTrailerActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'disconnectTrailerAction' && (
          <DisconnectTrailerActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'animationAction' && (
          <AnimationActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'lightStateAction' && (
          <LightStateActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'overrideControllerAction' && (
          <OverrideControllerActionEditor
            action={action}
            onUpdate={(p) => onUpdate(action.id, p)}
          />
        )}
        {actionType === 'entityAction' && (
          <EntityActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'environmentAction' && (
          <EnvironmentActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'trafficAction' && (
          <TrafficActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
        {actionType === 'infrastructureAction' && (
          <InfrastructureActionEditor action={action} onUpdate={(p) => onUpdate(action.id, p)} />
        )}
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
