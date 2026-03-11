import type { Condition, ByValueCondition, UserDefinedValueCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { RULES } from '../../../constants/osc-enum-values';

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
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">User Defined Value</p>
        <div className="grid gap-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={cond.name}
            onChange={(e) => update({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Value</Label>
          <Input
            value={cond.value}
            onChange={(e) => update({ value: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Rule</Label>
          <EnumSelect
            value={cond.rule}
            options={RULES}
            onValueChange={(v) => update({ rule: v as UserDefinedValueCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
