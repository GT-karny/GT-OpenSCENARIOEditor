import type {
  Condition,
  ByValueCondition,
  StoryboardElementStateCondition,
  StoryboardElementType,
  StoryboardElementState,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';

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
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as StoryboardElementStateCondition;

  const update = (updates: Partial<StoryboardElementStateCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Storyboard Element State</p>
        <div className="grid gap-1">
          <Label className="text-xs">Storyboard Element Ref</Label>
          <Input
            value={cond.storyboardElementRef}
            onChange={(e) => update({ storyboardElementRef: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Storyboard Element Type</Label>
          <EnumSelect
            value={cond.storyboardElementType}
            options={STORYBOARD_ELEMENT_TYPES}
            onValueChange={(v) => update({ storyboardElementType: v as StoryboardElementType })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">State</Label>
          <EnumSelect
            value={cond.state}
            options={STORYBOARD_ELEMENT_STATES}
            onValueChange={(v) => update({ state: v as StoryboardElementState })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
