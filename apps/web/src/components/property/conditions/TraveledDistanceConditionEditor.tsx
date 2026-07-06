import type { Condition, ByEntityCondition, TraveledDistanceCondition } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { entityConditionUpdate } from '../lib/typed-updates';

interface TraveledDistanceConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TraveledDistanceConditionEditor({ condition, onUpdate }: TraveledDistanceConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByEntityCondition;
  const cond = inner.entityCondition as TraveledDistanceCondition;

  const update = (updates: Partial<TraveledDistanceCondition>) => {
    onUpdate(condition.id, entityConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t('conditionEditors.traveledDistance.title')}
        </p>
        <div className="grid gap-1">
          <Label className="text-[10px]">{t('conditionEditors.common.value')} (m)</Label>
          <ParameterAwareInput
            elementId={condition.id}
            fieldName="value"
            value={cond.value}
            onValueChange={(v) => update({ value: parseFloat(v) || 0 })}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
