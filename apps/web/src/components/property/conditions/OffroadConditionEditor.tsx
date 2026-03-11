import type { Condition, ByEntityCondition, OffroadCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';

interface OffroadConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function OffroadConditionEditor({ condition, onUpdate }: OffroadConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as OffroadCondition;

  const update = (updates: Partial<OffroadCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Offroad</p>
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
