import type {
  Condition,
  ByValueCondition,
  StoryboardElementStateCondition,
  StoryboardElementType,
  StoryboardElementState,
} from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { EnumSelect } from '../EnumSelect';
import { StoryboardElementRefSelect } from '../StoryboardElementRefSelect';
import { valueConditionUpdate } from '../lib/typed-updates';

const STORYBOARD_ELEMENT_TYPES: readonly StoryboardElementType[] = [
  'story',
  'act',
  'maneuverGroup',
  'maneuver',
  'event',
  'action',
] as const;

const STORYBOARD_ELEMENT_STATES: readonly StoryboardElementState[] = [
  'startTransition',
  'endTransition',
  'stopTransition',
  'skipTransition',
  'completeState',
  'runningState',
  'standbyState',
] as const;

interface StoryboardElementStateConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function StoryboardElementStateConditionEditor({ condition, onUpdate }: StoryboardElementStateConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as StoryboardElementStateCondition;

  const update = (updates: Partial<StoryboardElementStateCondition>) => {
    onUpdate(condition.id, valueConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t('conditionEditors.storyboardElementState.title')}
        </p>
        <div className="grid gap-1">
          <Label className="text-[10px]">
            {t('conditionEditors.storyboardElementState.elementRef')}
          </Label>
          <StoryboardElementRefSelect
            value={cond.storyboardElementRef}
            onValueChange={(v) => update({ storyboardElementRef: v })}
            elementType={cond.storyboardElementType}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">
            {t('conditionEditors.storyboardElementState.elementType')}
          </Label>
          <EnumSelect
            value={cond.storyboardElementType}
            options={STORYBOARD_ELEMENT_TYPES}
            onValueChange={(v) => update({ storyboardElementType: v as StoryboardElementType })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">
            {t('conditionEditors.storyboardElementState.state')}
          </Label>
          <EnumSelect
            value={cond.state}
            options={STORYBOARD_ELEMENT_STATES}
            onValueChange={(v) => update({ state: v as StoryboardElementState })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
