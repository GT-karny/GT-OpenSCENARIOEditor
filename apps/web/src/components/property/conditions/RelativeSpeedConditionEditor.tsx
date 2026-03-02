import type { Condition, ByEntityCondition, RelativeSpeedCondition, DirectionalDimension } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { RULES } from '../../../constants/osc-enum-values';

const DIRECTIONAL_DIMENSIONS = ['longitudinal', 'lateral', 'vertical'] as const;

interface RelativeSpeedConditionEditorProps {
  condition: Condition;
}

export function RelativeSpeedConditionEditor({ condition }: RelativeSpeedConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeSpeedCondition;

  const update = (updates: Partial<RelativeSpeedCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Relative Speed</p>
        <div className="grid gap-1">
          <Label className="text-xs">Entity Ref</Label>
          <Input
            value={cond.entityRef}
            onChange={(e) => update({ entityRef: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Value (m/s)</Label>
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
                storeApi.getState().updateCondition(condition.id, {
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
