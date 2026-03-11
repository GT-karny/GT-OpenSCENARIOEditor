import type { Condition, ByEntityCondition, TraveledDistanceCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';

interface TraveledDistanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TraveledDistanceConditionEditor({ condition, onUpdate }: TraveledDistanceConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TraveledDistanceCondition;

  const update = (updates: Partial<TraveledDistanceCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Traveled Distance</p>
        <div className="grid gap-1">
          <Label className="text-[10px]">Value (m)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.value}
            onValueChange={(v) => update({ value: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
