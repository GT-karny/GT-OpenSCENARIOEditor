import { useMemo } from 'react';
import type { Condition, ByValueCondition, ParameterCondition } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { valueConditionUpdate } from '../lib/typed-updates';
import { useScenarioStore } from '../../../../../stores/use-scenario-store';

interface ParameterConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function ParameterConditionEditor({ condition, onUpdate }: ParameterConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as ParameterCondition;
  const parameters = useScenarioStore((s) => s.document.parameterDeclarations);

  const paramItems: RefSelectItem[] = useMemo(
    () => parameters.map((p) => ({ name: p.name, description: `${p.parameterType} = ${p.value}` })),
    [parameters],
  );

  const update = (updates: Partial<ParameterCondition>) => {
    onUpdate(condition.id, valueConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t('conditionEditors.parameter.title')}
      </p>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.parameter.parameterRef')}</Label>
        <RefSelect
          value={cond.parameterRef}
          onValueChange={(v) => update({ parameterRef: v })}
          items={paramItems}
          placeholder={t('conditionEditors.parameter.selectPlaceholder')}
          emptyMessage={t('conditionEditors.parameter.emptyMessage')}
          className="h-7 text-xs"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.common.value')}</Label>
        <div className="flex gap-1">
          <ParameterAwareInput
            value={cond.value}
            onValueChange={(v) => update({ value: v })}
            acceptedTypes={['string', 'double', 'int', 'boolean']}
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
