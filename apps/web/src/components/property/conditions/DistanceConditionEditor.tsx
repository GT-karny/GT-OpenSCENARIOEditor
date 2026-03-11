import type {
  Condition,
  ByEntityCondition,
  DistanceCondition,
  CoordinateSystemCond,
  RelativeDistanceType,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { PositionEditor } from '../PositionEditor';

const RELATIVE_DISTANCE_TYPES = ['longitudinal', 'lateral', 'euclidianDistance'] as const;
const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory'] as const;

interface DistanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function DistanceConditionEditor({ condition, onUpdate }: DistanceConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as DistanceCondition;

  const update = (updates: Partial<DistanceCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  const clearField = (field: 'coordinateSystem' | 'relativeDistanceType') => {
    const next = { ...cond };
    delete next[field];
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: next },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Distance</p>
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
        <OptionalFieldWrapper
          label="Coordinate System"
          hasValue={cond.coordinateSystem !== undefined}
          onClear={() => clearField('coordinateSystem')}
        >
          <SegmentedControl
            value={cond.coordinateSystem ?? 'entity'}
            options={COORDINATE_SYSTEMS}
            onValueChange={(v) => update({ coordinateSystem: v as CoordinateSystemCond })}
            labels={{ entity: 'Entity', lane: 'Lane', road: 'Road', trajectory: 'Traj' }}
          />
        </OptionalFieldWrapper>
        <OptionalFieldWrapper
          label="Relative Distance Type"
          hasValue={cond.relativeDistanceType !== undefined}
          onClear={() => clearField('relativeDistanceType')}
        >
          <SegmentedControl
            value={cond.relativeDistanceType ?? 'euclidianDistance'}
            options={RELATIVE_DISTANCE_TYPES}
            onValueChange={(v) => update({ relativeDistanceType: v as RelativeDistanceType })}
            labels={{ longitudinal: 'Long', lateral: 'Lat', euclidianDistance: 'Euclid' }}
          />
        </OptionalFieldWrapper>
      </div>
      <PositionEditor
        position={cond.position}
        onChange={(pos) => update({ position: pos })}
      />
    </div>
  );
}
