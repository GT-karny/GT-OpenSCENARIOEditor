import type { Condition, ByEntityCondition, AccelerationCondition, DirectionalDimension } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { RULES } from '../../../constants/osc-enum-values';

const DIRECTIONAL_DIMENSIONS = ['longitudinal', 'lateral', 'vertical'] as const;

interface AccelerationConditionEditorProps {
  condition: Condition;
}

export function AccelerationConditionEditor({ condition }: AccelerationConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as AccelerationCondition;

  const update = (updates: Partial<AccelerationCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Acceleration</p>
        <div className="grid gap-1">
          <Label className="text-xs">Value (m/s²)</Label>
          <Input
            type="number"
            value={cond.value}
            onChange={(e) => update({ value: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Rule</Label>
          <EnumSelect
            value={cond.rule}
            options={RULES}
            onValueChange={(v) => update({ rule: v as AccelerationCondition['rule'] })}
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
                storeApi.getState().updateCondition(condition.id, {
                  condition: { ...inner, entityCondition: rest as AccelerationCondition },
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
