import type { Condition, ByValueCondition, SimulationTimeCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';

interface SimulationTimeConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function SimulationTimeConditionEditor({ condition, onUpdate }: SimulationTimeConditionEditorProps) {
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as SimulationTimeCondition;

  const update = (updates: Partial<SimulationTimeCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Simulation Time</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Value (s)</Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.value}
            onValueChange={(v) => update({ value: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
