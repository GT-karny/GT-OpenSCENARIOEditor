import type { Condition, ByValueCondition, VariableCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { RULES } from '../../../constants/osc-enum-values';

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
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Variable Condition</p>
        <div className="grid gap-1">
          <Label className="text-xs">Variable Ref</Label>
          <Input
            value={cond.variableRef}
            onChange={(e) => update({ variableRef: e.target.value })}
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
            onValueChange={(v) => update({ rule: v as VariableCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
