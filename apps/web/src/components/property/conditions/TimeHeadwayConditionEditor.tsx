import type { Condition, ByEntityCondition, TimeHeadwayCondition, CoordinateSystemCond } from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { RULES } from '../../../constants/osc-enum-values';

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

  const remove = (...keys: (keyof TimeHeadwayCondition)[]) => {
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
        <Label className="text-xs">Entity Ref</Label>
        <EntityRefSelect
          value={cond.entityRef}
          onValueChange={(v) => update({ entityRef: v })}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Value (s)</Label>
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
        <Label className="text-xs">Freespace</Label>
        <EnumSelect
          value={String(cond.freespace)}
          options={['false', 'true']}
          onValueChange={(v) => update({ freespace: v === 'true' })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Rule</Label>
        <EnumSelect
          value={cond.rule}
          options={RULES}
          onValueChange={(v) => update({ rule: v as TimeHeadwayCondition['rule'] })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Coordinate System (optional)</Label>
        <EnumSelect
          value={cond.coordinateSystem ?? ''}
          options={['', 'entity', 'lane', 'road', 'trajectory']}
          onValueChange={(v) =>
            v === '' ? remove('coordinateSystem') : update({ coordinateSystem: v as CoordinateSystemCond })
          }
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Along Route (optional)</Label>
        <EnumSelect
          value={cond.alongRoute === undefined ? '' : String(cond.alongRoute)}
          options={['', 'false', 'true']}
          onValueChange={(v) =>
            v === '' ? remove('alongRoute') : update({ alongRoute: v === 'true' })
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
