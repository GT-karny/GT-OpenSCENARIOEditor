import type { Condition, ByValueCondition, UserDefinedValueCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RuleSegmentedControl } from '../RuleSegmentedControl';

interface UserDefinedValueConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function UserDefinedValueConditionEditor({
  condition,
  onUpdate,
}: UserDefinedValueConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as UserDefinedValueCondition;

  const update = (updates: Partial<UserDefinedValueCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">User Defined Value</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Name</Label>
        <Input
          value={cond.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-7 text-xs"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">Value</Label>
        <div className="flex gap-1">
          <Input
            value={cond.value}
            onChange={(e) => update({ value: e.target.value })}
            className="h-7 text-xs flex-1 min-w-0"
          />
          <RuleSegmentedControl
            value={cond.rule}
            onValueChange={(v) => update({ rule: v })}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
