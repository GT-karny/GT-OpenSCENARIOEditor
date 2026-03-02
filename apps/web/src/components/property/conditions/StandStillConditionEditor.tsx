import type { Condition, ByEntityCondition, StandStillCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface StandStillConditionEditorProps {
  condition: Condition;
}

export function StandStillConditionEditor({ condition }: StandStillConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as StandStillCondition;

  const update = (updates: Partial<StandStillCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Stand Still</p>
        <div className="grid gap-1">
          <Label className="text-xs">Duration (s)</Label>
          <Input
            type="number"
            value={cond.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
