import type { Condition, ByValueCondition, ParameterCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RuleSegmentedControl } from '../RuleSegmentedControl';

interface ParameterConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function ParameterConditionEditor({ condition, onUpdate }: ParameterConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as ParameterCondition;

  const update = (updates: Partial<ParameterCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Parameter Condition</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Parameter Ref</Label>
        <Input
          value={cond.parameterRef}
          onChange={(e) => update({ parameterRef: e.target.value })}
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
