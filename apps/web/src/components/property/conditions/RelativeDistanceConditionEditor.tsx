import type {
  Condition,
  ByEntityCondition,
  RelativeDistanceCondition,
  RelativeDistanceType,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { RULES } from '../../../constants/osc-enum-values';

const RELATIVE_DISTANCE_TYPES: readonly string[] = [
  'longitudinal',
  'lateral',
  'euclidianDistance',
];

interface RelativeDistanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function RelativeDistanceConditionEditor({
  condition,
  onUpdate,
}: RelativeDistanceConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeDistanceCondition;

  const update = (updates: Partial<RelativeDistanceCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Relative Distance</p>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Ref</Label>
          <EntityRefSelect
            value={cond.entityRef}
            onValueChange={(v) => update({ entityRef: v })}
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Distance Type</Label>
          <EnumSelect
            value={cond.relativeDistanceType}
            options={RELATIVE_DISTANCE_TYPES}
            onValueChange={(v) => update({ relativeDistanceType: v as RelativeDistanceType })}
            className="h-8 text-sm"
          />
        </div>
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
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${condition.id}-freespace`}
            checked={cond.freespace}
            onChange={(e) => update({ freespace: e.target.checked })}
            className="size-3.5"
          />
          <Label htmlFor={`${condition.id}-freespace`} className="text-xs">
            Freespace
          </Label>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Rule</Label>
          <EnumSelect
            value={cond.rule}
            options={RULES}
            onValueChange={(v) => update({ rule: v as RelativeDistanceCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
