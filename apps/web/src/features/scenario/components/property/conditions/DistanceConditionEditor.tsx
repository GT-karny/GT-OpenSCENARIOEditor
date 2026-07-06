import type {
  Condition,
  ByEntityCondition,
  DistanceCondition,
  CoordinateSystemCond,
  RelativeDistanceType,
} from '@osce/shared';
import { COORDINATE_SYSTEMS as OSC_COORDINATE_SYSTEMS, RELATIVE_DISTANCE_TYPES as OSC_RELATIVE_DISTANCE_TYPES } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { PositionEditor } from '../PositionEditor';
import { entityConditionReplace, entityConditionUpdate } from '../lib/typed-updates';

// Deprecated 'cartesianDistance' is filtered out of the UI; values come from @osce/shared.
const RELATIVE_DISTANCE_TYPES = OSC_RELATIVE_DISTANCE_TYPES.filter(
  (t) => t !== 'cartesianDistance',
);
const COORDINATE_SYSTEMS = OSC_COORDINATE_SYSTEMS;

interface DistanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function DistanceConditionEditor({ condition, onUpdate }: DistanceConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as DistanceCondition;

  const update = (updates: Partial<DistanceCondition>) => {
    onUpdate(condition.id, entityConditionUpdate(inner, cond, updates));
  };

  const clearField = (field: 'coordinateSystem' | 'relativeDistanceType') => {
    const next = { ...cond };
    delete next[field];
    onUpdate(condition.id, entityConditionReplace(inner, next));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t('conditionEditors.distance.title')}
        </p>
        <div className="grid gap-1">
          <Label className="text-[10px]">{t('conditionEditors.common.value')} (m)</Label>
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
      <PositionEditor
        position={cond.position}
        onChange={(pos) => update({ position: pos })}
      />
    </div>
  );
}
