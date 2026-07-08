import type { Condition, ByValueCondition, UserDefinedValueCondition } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { valueConditionUpdate } from '../lib/typed-updates';

interface UserDefinedValueConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function UserDefinedValueConditionEditor({
  condition,
  onUpdate,
}: UserDefinedValueConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as UserDefinedValueCondition;

  const update = (updates: Partial<UserDefinedValueCondition>) => {
    onUpdate(condition.id, valueConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t('conditionEditors.userDefinedValue.title')}
      </p>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.userDefinedValue.name')}</Label>
        <ParameterAwareInput
          value={cond.name}
          onValueChange={(v) => update({ name: v })}
          acceptedTypes={['string']}
          className="h-7 text-xs"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.common.value')}</Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            value={cond.value}
            onValueChange={(v) => update({ value: v })}
            acceptedTypes={['string']}
            className="h-7 text-xs flex-1 min-w-0"
          />
          <RuleSegmentedControl
            value={cond.rule}
            onValueChange={(v) => update({ rule: v })}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
