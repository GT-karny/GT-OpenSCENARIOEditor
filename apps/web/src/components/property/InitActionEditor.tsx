import { useMemo } from 'react';
import type { InitPrivateAction, ScenarioAction, PrivateAction } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Lock } from 'lucide-react';
import { defaultActionByType } from '@osce/scenario-engine';
import { Label } from '../ui/label';
import {
  PRIVATE_ACTION_SUBCATEGORIES,
} from '../../constants/osc-enum-values';
import { useFeatureGate } from '../../hooks/use-feature-gate';
import { cn } from '../../lib/utils';

// Action editors (reused from Event editing)
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
import { SpeedProfileActionEditor } from './actions/SpeedProfileActionEditor';
import { LateralDistanceActionEditor } from './actions/LateralDistanceActionEditor';
import { GenericActionEditor } from './actions/GenericActionEditor';

const POSITION_BASED_TYPES = ['teleportAction', 'synchronizeAction'] as const;

function detectSubcategory(type: string): string {
  for (const sub of PRIVATE_ACTION_SUBCATEGORIES) {
    if ((sub.types as readonly string[]).includes(type)) return sub.key;
  }
  return PRIVATE_ACTION_SUBCATEGORIES[0].key;
}

interface InitActionEditorProps {
  initAction: InitPrivateAction;
  onUpdateAction: (actionId: string, newAction: PrivateAction) => void;
}

/** Lower section: type selector + action-specific field editor for the selected Init action. */
export function InitActionEditor({ initAction, onUpdateAction }: InitActionEditorProps) {
  const { t } = useTranslation('openscenario');
  const { checkAction } = useFeatureGate();
  const actionType = initAction.action.type;
  const subcategory = detectSubcategory(actionType);

  const typeList = useMemo(() => {
    const sub = PRIVATE_ACTION_SUBCATEGORIES.find((s) => s.key === subcategory);
    return sub ? [...sub.types] : [];
  }, [subcategory]);

  const handleSubcategoryChange = (newSubKey: string) => {
    if (newSubKey === subcategory) return;
    const sub = PRIVATE_ACTION_SUBCATEGORIES.find((s) => s.key === newSubKey);
    if (sub) {
      onUpdateAction(initAction.id, defaultActionByType(sub.types[0]) as PrivateAction);
    }
  };

  const handleTypeChange = (newType: string) => {
    if (newType === actionType) return;
    onUpdateAction(initAction.id, defaultActionByType(newType) as PrivateAction);
  };

  // Adapter: wrap InitPrivateAction as ScenarioAction for existing editors
  const pseudoAction: ScenarioAction = useMemo(
    () => ({ id: initAction.id, name: '', action: initAction.action }),
    [initAction.id, initAction.action],
  );

  const handleEditorUpdate = (_actionId: string, partial: Partial<ScenarioAction>) => {
    if (partial.action) {
      onUpdateAction(initAction.id, partial.action as PrivateAction);
    }
  };

  const onUpdate = (partial: Partial<ScenarioAction>) => handleEditorUpdate(initAction.id, partial);

  return (
    <div className="space-y-3">
      {/* Subcategory tabs */}
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

      {/* Type list */}
      <div className="grid gap-1.5">
        <Label className="text-xs">Type</Label>
        <div className="mx-4 flex flex-col divide-y divide-[var(--color-glass-edge)] border border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
          {typeList.map((type) => {
            const gate = checkAction(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => gate.allowed && handleTypeChange(type)}
                disabled={!gate.allowed}
                title={gate.allowed ? undefined : gate.reason}
                className={cn(
                  'px-3 py-1.5 text-left text-xs transition-all flex items-center justify-between',
                  actionType === type
                    ? 'glass-item selected font-medium'
                    : gate.allowed
                      ? 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]'
                      : 'text-muted-foreground/40 cursor-not-allowed',
                )}
              >
                <span>{t(`actionTypes.${type}` as never)}</span>
                {!gate.allowed && <Lock className="size-3 text-muted-foreground/40" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action-specific editor */}
      <div className="pt-1 border-t border-[var(--color-glass-edge)]">
        <ActionFieldsRouter action={pseudoAction} onUpdate={onUpdate} actionType={actionType} />
      </div>
    </div>
  );
}

/** Routes to the correct action editor component based on type. */
function ActionFieldsRouter({
  action,
  onUpdate,
  actionType,
}: {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
  actionType: string;
}) {
  switch (actionType) {
    case 'speedAction':
      return <SpeedActionEditor action={action} onUpdate={onUpdate} />;
    case 'laneChangeAction':
      return <LaneChangeActionEditor action={action} onUpdate={onUpdate} />;
    case 'longitudinalDistanceAction':
      return <LongitudinalDistanceActionEditor action={action} onUpdate={onUpdate} />;
    case 'laneOffsetAction':
      return <LaneOffsetActionEditor action={action} onUpdate={onUpdate} />;
    case 'acquirePositionAction':
      return <AcquirePositionActionEditor action={action} onUpdate={onUpdate} />;
    case 'activateControllerAction':
      return <ActivateControllerActionEditor action={action} onUpdate={onUpdate} />;
    case 'assignControllerAction':
      return <AssignControllerActionEditor action={action} onUpdate={onUpdate} />;
    case 'followTrajectoryAction':
      return <FollowTrajectoryActionEditor action={action} onUpdate={onUpdate} />;
    case 'routingAction':
      return <RoutingActionEditor action={action} onUpdate={onUpdate} />;
    case 'visibilityAction':
      return <VisibilityActionEditor action={action} onUpdate={onUpdate} />;
    case 'connectTrailerAction':
      return <ConnectTrailerActionEditor action={action} onUpdate={onUpdate} />;
    case 'disconnectTrailerAction':
      return <DisconnectTrailerActionEditor action={action} onUpdate={onUpdate} />;
    case 'animationAction':
      return <AnimationActionEditor action={action} onUpdate={onUpdate} />;
    case 'lightStateAction':
      return <LightStateActionEditor action={action} onUpdate={onUpdate} />;
    case 'overrideControllerAction':
      return <OverrideControllerActionEditor action={action} onUpdate={onUpdate} />;
    case 'speedProfileAction':
      return <SpeedProfileActionEditor action={action} onUpdate={onUpdate} />;
    case 'lateralDistanceAction':
      return <LateralDistanceActionEditor action={action} onUpdate={onUpdate} />;
    default:
      break;
  }

  // Position-based types (teleportAction, synchronizeAction)
  if ((POSITION_BASED_TYPES as readonly string[]).includes(actionType)) {
    return <TeleportActionEditor action={action} onUpdate={onUpdate} />;
  }

  // Fallback: generic JSON editor
  return <GenericActionEditor action={action} onUpdate={onUpdate} />;
}
