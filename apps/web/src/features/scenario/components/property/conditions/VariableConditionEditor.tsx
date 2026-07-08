import { useMemo } from 'react';
import type { Condition, ByValueCondition, VariableCondition } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../../../../components/ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RuleSegmentedControl } from '../RuleSegmentedControl';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { valueConditionUpdate } from '../lib/typed-updates';
import { useScenarioStore } from '../../../../../stores/use-scenario-store';

interface VariableConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function VariableConditionEditor({ condition, onUpdate }: VariableConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as VariableCondition;
  const variables = useScenarioStore((s) => s.document.variableDeclarations);

  const varItems: RefSelectItem[] = useMemo(
    () => variables.map((v) => ({ name: v.name, description: `${v.variableType} = ${v.value}` })),
    [variables],
  );

  const update = (updates: Partial<VariableCondition>) => {
    onUpdate(condition.id, valueConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {t('conditionEditors.variable.title')}
      </p>
      <div className="grid gap-1">
        <Label className="text-[10px]">{t('conditionEditors.variable.variableRef')}</Label>
        <RefSelect
          value={cond.variableRef}
          onValueChange={(v) => update({ variableRef: v })}
          items={varItems}
          placeholder={t('conditionEditors.variable.selectPlaceholder')}
          emptyMessage={t('conditionEditors.variable.emptyMessage')}
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
