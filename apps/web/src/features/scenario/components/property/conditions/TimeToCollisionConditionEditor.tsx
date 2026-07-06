import type {
  Condition,
  ByEntityCondition,
  TimeToCollisionCondition,
  TimeToCollisionTarget,
  CoordinateSystemCond,
  RelativeDistanceType,
  Position,
} from '@osce/shared';
import {
  COORDINATE_SYSTEMS,
  RELATIVE_DISTANCE_TYPES as OSC_RELATIVE_DISTANCE_TYPES,
} from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { PositionEditor } from '../PositionEditor';
import { entityConditionReplace, entityConditionUpdate } from '../lib/typed-updates';

// Deprecated 'cartesianDistance' is filtered out of the UI; values come from @osce/shared.
const RELATIVE_DISTANCE_TYPES = OSC_RELATIVE_DISTANCE_TYPES.filter(
  (t) => t !== 'cartesianDistance',
);
const TARGET_KINDS = ['entity', 'position'] as const;

interface TimeToCollisionConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TimeToCollisionConditionEditor({ condition, onUpdate }: TimeToCollisionConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TimeToCollisionCondition;

  const update = (updates: Partial<TimeToCollisionCondition>) => {
    onUpdate(condition.id, entityConditionUpdate(inner, cond, updates));
  };

  const clearField = (field: 'coordinateSystem' | 'relativeDistanceType') => {
    const next = { ...cond };
    delete next[field];
    onUpdate(condition.id, entityConditionReplace(inner, next));
  };

  const handleTargetKindChange = (kind: string) => {
    if (kind === 'entity') {
      update({ target: { kind: 'entity', entityRef: '' } });
    } else {
      update({ target: { kind: 'position', position: { type: 'worldPosition', x: 0, y: 0 } } });
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
        <p className="text-xs font-medium text-muted-foreground">
          {t('conditionEditors.timeToCollision.title')}
        </p>
        <div className="grid gap-1">
          <Label className="text-[10px]">{t('conditionEditors.common.value')} (s)</Label>
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
          {t('conditionEditors.common.freespace')}
        </label>
        <div className="grid gap-1">
          <Label className="text-[10px]">{t('conditionEditors.timeToCollision.target')}</Label>
          <SegmentedControl
            value={cond.target.kind}
            options={TARGET_KINDS}
            onValueChange={handleTargetKindChange}
            labels={{ entity: 'Entity', position: 'Position' }}
          />
        </div>
        {cond.target.kind === 'entity' && (
          <div className="grid gap-1">
            <Label className="text-[10px]">
              {t('conditionEditors.timeToCollision.targetEntityRef')}
            </Label>
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
        <OptionalFieldWrapper
          label={t('conditionEditors.common.coordinateSystem')}
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
          label={t('conditionEditors.common.relativeDistanceType')}
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
    </div>
  );
}
