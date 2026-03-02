import type { Condition, ByEntityCondition, TimeHeadwayCondition, CoordinateSystemCond } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { RULES } from '../../../constants/osc-enum-values';

interface TimeHeadwayConditionEditorProps {
  condition: Condition;
}

export function TimeHeadwayConditionEditor({ condition }: TimeHeadwayConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TimeHeadwayCondition;

  const update = (updates: Partial<TimeHeadwayCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  const remove = (...keys: (keyof TimeHeadwayCondition)[]) => {
    const next = { ...cond };
    for (const k of keys) delete next[k];
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: next },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Time Headway</p>
      <div className="grid gap-1">
        <Label className="text-xs">Entity Ref</Label>
        <Input
          value={cond.entityRef}
          onChange={(e) => update({ entityRef: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Value (s)</Label>
        <Input
          type="number"
          value={cond.value}
          onChange={(e) => update({ value: parseFloat(e.target.value) || 0 })}
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
