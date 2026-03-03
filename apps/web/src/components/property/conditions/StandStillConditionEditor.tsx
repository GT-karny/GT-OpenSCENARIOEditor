import type { Condition, ByEntityCondition, StandStillCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
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
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.duration}
            onValueChange={(v) => update({ duration: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
