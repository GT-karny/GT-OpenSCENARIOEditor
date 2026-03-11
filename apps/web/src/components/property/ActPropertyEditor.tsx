import { useState, useEffect, useMemo } from 'react';
import type { Act, Condition, Trigger } from '@osce/shared';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { SegmentedControl } from './SegmentedControl';
import { TriggerSectionEditor } from './TriggerSectionEditor';

type TriggerTab = 'start' | 'stop';

const TRIGGER_TABS = ['start', 'stop'] as const;
const TRIGGER_LABELS: Record<TriggerTab, string> = {
  start: 'Start Trigger',
  stop: 'Stop Trigger',
};

interface ActPropertyEditorProps {
  act: Act;
}

export function ActPropertyEditor({ act }: ActPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();
  const [triggerTab, setTriggerTab] = useState<TriggerTab>('start');
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  // Reset condition selection when Act or trigger tab changes
  useEffect(() => {
    setSelectedConditionId(null);
  }, [act.id, triggerTab]);

  // Ensure StopTrigger exists when switching to stop tab
  const stopTrigger = useMemo<Trigger>(() => {
    if (act.stopTrigger) return act.stopTrigger;
    return { id: `${act.id}_stopTrigger_placeholder`, conditionGroups: [] };
  }, [act.stopTrigger, act.id]);

  const activeTrigger = triggerTab === 'start' ? act.startTrigger : stopTrigger;

  // ── Trigger callbacks ──────────────────────────────────────────

  /** Ensure a real StopTrigger exists in the store before mutating */
  const ensureStopTrigger = (): Trigger => {
    if (act.stopTrigger) return act.stopTrigger;
    const newTrigger: Trigger = { id: crypto.randomUUID(), conditionGroups: [] };
    storeApi.getState().setStopTrigger(act.id, newTrigger);
    // Re-read from store (synchronous update)
    const updated = findActInStore(storeApi.getState(), act.id);
    return updated?.stopTrigger ?? newTrigger;
  };

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
    const trigger = triggerTab === 'start' ? act.startTrigger : ensureStopTrigger();
    const newGroup = store.addConditionGroup(trigger.id);
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

  const handleUpdateCondition = (conditionId: string, partial: Partial<Condition>) => {
    storeApi.getState().updateCondition(conditionId, partial);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Act name (display only — edit via tab bar) */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Act: {act.name}
      </p>

      {/* Start / Stop Trigger toggle */}
      <SegmentedControl
        value={triggerTab}
        options={TRIGGER_TABS}
        onValueChange={setTriggerTab}
        labels={TRIGGER_LABELS}
      />

      {/* Trigger editor */}
      <TriggerSectionEditor
        trigger={activeTrigger}
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

// ── Helpers ───────────────────────────────────────────────────────

function findActInStore(
  store: ReturnType<ReturnType<typeof useScenarioStoreApi>['getState']>,
  actId: string,
): Act | undefined {
  for (const story of store.document.storyboard.stories) {
    const found = story.acts.find((a) => a.id === actId);
    if (found) return found;
  }
  return undefined;
}
