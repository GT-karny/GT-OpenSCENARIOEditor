import type { Condition, ByEntityCondition, EndOfRoadCondition } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';

interface EndOfRoadConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function EndOfRoadConditionEditor({ condition, onUpdate }: EndOfRoadConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as EndOfRoadCondition;

  const update = (updates: Partial<EndOfRoadCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">End of Road</p>
        <div className="grid gap-1">
          <Label className="text-[10px]">Duration (s)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.duration}
            onValueChange={(v) => update({ duration: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
