import type {
  Condition,
  ByEntityCondition,
  TimeToCollisionCondition,
  TimeToCollisionTarget,
  CoordinateSystemCond,
  RelativeDistanceType,
  Position,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { EnumSelect } from '../EnumSelect';
import { PositionEditor } from '../PositionEditor';
import { RULES } from '../../../constants/osc-enum-values';

const COORDINATE_SYSTEMS = ['entity', 'lane', 'road', 'trajectory'] as const;
const RELATIVE_DISTANCE_TYPES = ['longitudinal', 'lateral', 'euclidianDistance'] as const;
const TARGET_KINDS = ['entity', 'position'] as const;

interface TimeToCollisionConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TimeToCollisionConditionEditor({ condition, onUpdate }: TimeToCollisionConditionEditorProps) {
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TimeToCollisionCondition;

  const update = (updates: Partial<TimeToCollisionCondition>) => {
    onUpdate(condition.id, {
      condition: { ...inner, entityCondition: { ...cond, ...updates } },
    } as Partial<Condition>);
  };

  const handleTargetKindChange = (kind: string) => {
    if (kind === 'entity') {
      update({
        target: { kind: 'entity', entityRef: '' },
      });
    } else {
      update({
        target: {
          kind: 'position',
          position: { type: 'worldPosition', x: 0, y: 0 },
        },
      });
    }
  };

  const handleEntityRefChange = (entityRef: string) => {
    update({ target: { kind: 'entity', entityRef } });
  };

  const handlePositionChange = (position: Position) => {
    update({ target: { kind: 'position', position } });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Time To Collision</p>
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
            onValueChange={(v) => update({ rule: v as TimeToCollisionCondition['rule'] })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Target Kind</Label>
          <EnumSelect
            value={cond.target.kind}
            options={TARGET_KINDS}
            onValueChange={handleTargetKindChange}
            className="h-8 text-sm"
          />
        </div>
        {cond.target.kind === 'entity' && (
          <div className="grid gap-1">
            <Label className="text-xs">Target Entity Ref</Label>
            <EntityRefSelect
              value={(cond.target as Extract<TimeToCollisionTarget, { kind: 'entity' }>).entityRef}
              onValueChange={handleEntityRefChange}
            />
          </div>
        )}
        {cond.target.kind === 'position' && (
          <PositionEditor
            position={(cond.target as Extract<TimeToCollisionTarget, { kind: 'position' }>).position}
            onChange={handlePositionChange}
          />
        )}
        <div className="grid gap-1">
          <Label className="text-xs">Coordinate System (optional)</Label>
          <EnumSelect
            value={cond.coordinateSystem ?? ''}
            options={['', ...COORDINATE_SYSTEMS]}
            onValueChange={(v) => {
              if (v === '') {
                const { coordinateSystem: _cs, ...rest } = cond;
                onUpdate(condition.id, {
                  condition: { ...inner, entityCondition: rest as TimeToCollisionCondition },
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
                onUpdate(condition.id, {
                  condition: { ...inner, entityCondition: rest as TimeToCollisionCondition },
                } as Partial<Condition>);
              } else {
                update({ relativeDistanceType: v as RelativeDistanceType });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
