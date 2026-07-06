import type { Condition, ByEntityCondition, RelativeSpeedCondition, DirectionalDimension } from '@osce/shared';
import { DIRECTIONAL_DIMENSIONS } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { EntityRefSelect } from '../EntityRefSelect';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { entityConditionReplace, entityConditionUpdate } from '../lib/typed-updates';
import { useSpeedUnit } from '../../../hooks/use-speed-unit';

interface RelativeSpeedConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function RelativeSpeedConditionEditor({ condition, onUpdate }: RelativeSpeedConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as RelativeSpeedCondition;
  const { label: speedLabel, toDisplay, toInternal } = useSpeedUnit();

  const update = (updates: Partial<RelativeSpeedCondition>) => {
    onUpdate(condition.id, entityConditionUpdate(inner, cond, updates));
  };

  const clearDirection = () => {
    const { direction: _d, ...rest } = cond;
    onUpdate(condition.id, entityConditionReplace(inner, rest));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t('conditionEditors.relativeSpeed.title')}
      </p>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.common.entityRef')}</Label>
        <EntityRefSelect
          value={cond.entityRef}
          onValueChange={(v) => update({ entityRef: v })}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">
          {t('conditionEditors.common.value')} ({speedLabel})
        </Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={toDisplay(cond.value)}
            onValueChange={(v) => update({ value: toInternal(parseFloat(v) || 0) })}
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
      <OptionalFieldWrapper
        label={t('conditionEditors.common.direction')}
        hasValue={cond.direction !== undefined}
        onClear={clearDirection}
      >
        <SegmentedControl
          value={cond.direction ?? 'longitudinal'}
          options={DIRECTIONAL_DIMENSIONS}
          onValueChange={(v) => update({ direction: v as DirectionalDimension })}
          labels={{ longitudinal: 'Long', lateral: 'Lat', vertical: 'Vert' }}
        />
      </OptionalFieldWrapper>
    </div>
  );
}
