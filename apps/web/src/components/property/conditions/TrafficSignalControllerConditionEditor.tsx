import { useMemo } from 'react';
import type {
  Condition,
  ByValueCondition,
  TrafficSignalControllerCondition,
  TrafficSignalController,
} from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { valueConditionUpdate } from '../lib/typed-updates';
import { useScenarioStore } from '../../../stores/use-scenario-store';

const EMPTY_SIGNALS: TrafficSignalController[] = [];

interface TrafficSignalControllerConditionEditorProps {
  condition: Condition;
  onUpdate: (conditionId: string, partial: Partial<Condition>) => void;
}

export function TrafficSignalControllerConditionEditor({
  condition,
  onUpdate,
}: TrafficSignalControllerConditionEditorProps) {
  const { t } = useTranslation('common');
  const inner = condition.condition as ByValueCondition;
  const cond = inner.valueCondition as TrafficSignalControllerCondition;
  const controllers = useScenarioStore((s) => s.document.roadNetwork.trafficSignals ?? EMPTY_SIGNALS);

  const controllerItems: RefSelectItem[] = useMemo(
    () =>
      controllers.map((c) => ({
        name: c.name,
        description: `${c.phases.length} phase(s)`,
      })),
    [controllers],
  );

  const update = (updates: Partial<TrafficSignalControllerCondition>) => {
    onUpdate(condition.id, valueConditionUpdate(inner, cond, updates));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t('conditionEditors.trafficSignalController.title')}
        </p>
        <div className="grid gap-1">
          <Label className="text-[10px]">
            {t('conditionEditors.trafficSignalController.controllerRef')}
          </Label>
          <RefSelect
            value={cond.trafficSignalControllerRef}
            onValueChange={(v) => update({ trafficSignalControllerRef: v })}
            items={controllerItems}
            placeholder={t('conditionEditors.trafficSignalController.selectPlaceholder')}
            emptyMessage={t('conditionEditors.trafficSignalController.emptyMessage')}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[10px]">{t('conditionEditors.trafficSignalController.phase')}</Label>
          <ParameterAwareInput
            value={cond.phase}
            placeholder={t('conditionEditors.trafficSignalController.phasePlaceholder')}
            onValueChange={(v) => update({ phase: v })}
            acceptedTypes={['string']}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
