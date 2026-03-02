import type {
  Condition,
  ByEntityCondition,
  DistanceCondition,
  CoordinateSystemCond,
  RelativeDistanceType,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { PositionEditor } from '../PositionEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { RULES } from '../../../constants/osc-enum-values';

const RELATIVE_DISTANCE_TYPES = ['longitudinal', 'lateral', 'euclidianDistance'] as const;
const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory'] as const;

interface DistanceConditionEditorProps {
  condition: Condition;
}

export function DistanceConditionEditor({ condition }: DistanceConditionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as DistanceCondition;

  const update = (updates: Partial<DistanceCondition>) => {
    storeApi.getState().updateCondition(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Distance</p>
        <div className="grid gap-1">
          <Label className="text-xs">Value (m)</Label>
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
            onValueChange={(v) => update({ rule: v as DistanceCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Coordinate System (optional)</Label>
          <EnumSelect
            value={cond.coordinateSystem ?? ''}
            options={['', ...COORDINATE_SYSTEMS]}
            onValueChange={(v) => {
              if (v === '') {
                const { coordinateSystem: _cs, ...rest } = cond;
                storeApi.getState().updateCondition(condition.id, {
                  condition: { ...inner, entityCondition: rest as DistanceCondition },
                } as Partial<Condition>);
              } else {
                update({ coordinateSystem: v as CoordinateSystemCond });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Relative Distance Type (optional)</Label>
          <EnumSelect
            value={cond.relativeDistanceType ?? ''}
            options={['', ...RELATIVE_DISTANCE_TYPES]}
            onValueChange={(v) => {
              if (v === '') {
                const { relativeDistanceType: _rdt, ...rest } = cond;
                storeApi.getState().updateCondition(condition.id, {
                  condition: { ...inner, entityCondition: rest as DistanceCondition },
                } as Partial<Condition>);
              } else {
                update({ relativeDistanceType: v as RelativeDistanceType });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <PositionEditor
        position={cond.position}
        onChange={(pos) => update({ position: pos })}
      />
    </div>
  );
}
