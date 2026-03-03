import type { Condition, ByEntityCondition, TraveledDistanceCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface TraveledDistanceConditionEditorProps {
  condition: Condition;
}

export function TraveledDistanceConditionEditor({ condition }: TraveledDistanceConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TraveledDistanceCondition;

  const update = (updates: Partial<TraveledDistanceCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Traveled Distance</p>
        <div className="grid gap-1">
          <Label className="text-xs">Value (m)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.value}
            onValueChange={(v) => update({ value: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
