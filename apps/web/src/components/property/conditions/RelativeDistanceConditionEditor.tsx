import type {
  Condition,
  ByEntityCondition,
  RelativeDistanceCondition,
  RelativeDistanceType,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';

const RELATIVE_DISTANCE_TYPES = ['longitudinal', 'lateral', 'euclidianDistance'] as const;

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
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Relative Distance</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Entity Ref</Label>
        <EntityRefSelect
          value={cond.entityRef}
          onValueChange={(v) => update({ entityRef: v })}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">Distance Type</Label>
        <SegmentedControl
          value={cond.relativeDistanceType}
          options={RELATIVE_DISTANCE_TYPES}
          onValueChange={(v) => update({ relativeDistanceType: v as RelativeDistanceType })}
          labels={{ longitudinal: 'Long', lateral: 'Lat', euclidianDistance: 'Euclid' }}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">Value (m)</Label>
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
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={cond.freespace}
          onChange={(e) => update({ freespace: e.target.checked })}
        />
        Freespace
      </label>
    </div>
  );
}
