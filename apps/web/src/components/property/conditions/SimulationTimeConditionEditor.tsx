import type { Condition, ByValueCondition, SimulationTimeCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { RULES } from '../../../constants/osc-enum-values';

interface SimulationTimeConditionEditorProps {
  condition: Condition;
}

export function SimulationTimeConditionEditor({ condition }: SimulationTimeConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as SimulationTimeCondition;

  const update = (updates: Partial<SimulationTimeCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, valueCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Simulation Time</p>
      <div className="grid gap-1">
        <Label className="text-xs">Value (s)</Label>
        <Input
          type="number"
          value={cond.value}
          onChange={(e) => update({ value: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Rule</Label>
        <EnumSelect
          value={cond.rule}
          options={RULES}
          onValueChange={(v) => update({ rule: v as SimulationTimeCondition['rule'] })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
