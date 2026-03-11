import type { Condition, ByEntityCondition, RelativeSpeedCondition, DirectionalDimension } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { RULES } from '../../../constants/osc-enum-values';

const DIRECTIONAL_DIMENSIONS = ['longitudinal', 'lateral', 'vertical'] as const;

interface RelativeSpeedConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function RelativeSpeedConditionEditor({ condition, onUpdate }: RelativeSpeedConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeSpeedCondition;

  const update = (updates: Partial<RelativeSpeedCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Relative Speed</p>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Ref</Label>
          <EntityRefSelect
            value={cond.entityRef}
            onValueChange={(v) => update({ entityRef: v })}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Value (m/s)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.value}
            onValueChange={(v) => update({ value: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Rule</Label>
          <EnumSelect
            value={cond.rule}
            options={RULES}
            onValueChange={(v) => update({ rule: v as RelativeSpeedCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Direction (optional)</Label>
          <EnumSelect
            value={cond.direction ?? ''}
            options={['', ...DIRECTIONAL_DIMENSIONS]}
            onValueChange={(v) => {
              if (v === '') {
                const { direction: _d, ...rest } = cond;
                onUpdate(condition.id, {
                  condition: { ...inner, entityCondition: rest as RelativeSpeedCondition },
                } as Partial<Condition>);
              } else {
                update({ direction: v as DirectionalDimension });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
