import { useState, useEffect } from 'react';
import type { ScenarioEvent, EventPriority } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useTranslation } from '@osce/i18n';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';
import { TriggerSectionEditor } from './TriggerSectionEditor';
import { cn } from '../../lib/utils';

interface EventPropertyEditorProps {
  event: ScenarioEvent;
}

/**
 * Flat Priority + Trigger property editor for Events.
 * Shown when selecting an EventRow in the Composer view.
 */
export function EventPropertyEditor({ event }: EventPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();
  const { t } = useTranslation('openscenario');
  const { t: tc } = useTranslation('common');
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  // Reset condition selection when event changes
  useEffect(() => {
    setSelectedConditionId(null);
  }, [event.id]);

  const handlePriorityChange = (value: EventPriority) => {
    storeApi.getState().updateEvent(event.id, { priority: value });
  };

  const handleMaxExecCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = raw === '' ? undefined : parseInt(raw, 10);
    storeApi.getState().updateEvent(event.id, {
      maximumExecutionCount: parsed != null && !isNaN(parsed) ? parsed : undefined,
    });
  };

  // ── Trigger callbacks ──────────────────────────────────────────

  const handleAddCondition = (groupId: string) => {
    storeApi.getState().addCondition(groupId, {
      name: 'SimTime',
      delay: 0,
      conditionEdge: 'none',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    });
  };

  const handleAddOrGroup = () => {
    const store = storeApi.getState();
    const newGroup = store.addConditionGroup(event.startTrigger.id);
    store.addCondition(newGroup.id, {
      name: 'SimTime',
      delay: 0,
      conditionEdge: 'none',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    storeApi.getState().removeCondition(conditionId);
  };

  const handleRemoveGroup = (groupId: string) => {
    storeApi.getState().removeConditionGroup(groupId);
  };

  const handleUpdateCondition = (
    conditionId: string,
    partial: Partial<import('@osce/shared').Condition>,
  ) => {
    storeApi.getState().updateCondition(conditionId, partial);
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Priority — Segmented Control */}
      <div className="grid gap-1.5">
        <Label className="text-xs">{tc('catalog.priority')}</Label>
        <div className="flex gap-0.5 p-0.5 bg-muted">
          {EVENT_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePriorityChange(p)}
              className={cn(
                'flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium transition-all',
                event.priority === p
                  ? 'glass-item selected'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
              )}
            >
              {t(`eventPriority.${p}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Execution Count */}
      <div className="grid gap-1.5">
        <Label className="text-xs">{tc('catalog.maxExecutionCount')}</Label>
        <Input
          type="number"
          min={1}
          placeholder="-"
          value={event.maximumExecutionCount ?? ''}
          onChange={handleMaxExecCountChange}
          className="h-8 text-sm"
        />
      </div>

      {/* Trigger section */}
      <TriggerSectionEditor
        trigger={event.startTrigger}
        selectedConditionId={selectedConditionId}
        onSelectCondition={setSelectedConditionId}
        onUpdateCondition={handleUpdateCondition}
        onAddCondition={handleAddCondition}
        onRemoveCondition={handleRemoveCondition}
        onAddOrGroup={handleAddOrGroup}
        onRemoveGroup={handleRemoveGroup}
      />
    </div>
  );
}
