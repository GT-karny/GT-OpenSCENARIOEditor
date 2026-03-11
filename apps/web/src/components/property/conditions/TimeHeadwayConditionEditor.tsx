import type { Condition, ByEntityCondition, TimeHeadwayCondition, CoordinateSystemCond } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';

const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory'] as const;

interface TimeHeadwayConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TimeHeadwayConditionEditor({ condition, onUpdate }: TimeHeadwayConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TimeHeadwayCondition;

  const update = (updates: Partial<TimeHeadwayCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  const clearField = (...keys: (keyof TimeHeadwayCondition)[]) => {
    const next = { ...cond };
    for (const k of keys) delete next[k];
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: next },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Time Headway</p>
      <div className="grid gap-1">
        <Label className="text-[10px]">Entity Ref</Label>
        <EntityRefSelect
          value={cond.entityRef}
          onValueChange={(v) => update({ entityRef: v })}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">Value (s)</Label>
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
        label="Along Route"
        hasValue={cond.alongRoute !== undefined}
        onClear={() => clearField('alongRoute')}
      >
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={cond.alongRoute ?? false}
            onChange={(e) => update({ alongRoute: e.target.checked })}
          />
          Enabled
        </label>
      </OptionalFieldWrapper>
    </div>
  );
}
