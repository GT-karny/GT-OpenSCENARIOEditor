import type { Condition, ByValueCondition, VariableCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { RuleSegmentedControl } from '../RuleSegmentedControl';

interface VariableConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function VariableConditionEditor({ condition, onUpdate }: VariableConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as VariableCondition;

  const update = (updates: Partial<VariableCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Variable Condition</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Variable Ref</Label>
        <Input
          value={cond.variableRef}
          onChange={(e) => update({ variableRef: e.target.value })}
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
