import { Plus, Zap, X } from 'lucide-react';
import type { Act } from '@osce/shared';
import { ConditionPropertyEditor } from '../ConditionPropertyEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { getTriggerSummary } from '../../scene-composer/trigger-summary';

interface TriggersTabProps {
  act: Act | undefined;
}

export function TriggersTab({ act }: TriggersTabProps) {
  const storeApi = useScenarioStoreApi();

  if (!act) {
    return (
      <p className="text-xs text-muted-foreground italic p-2">
        Parent Act not found
      </p>
    );
  }

  const startConditions = act.startTrigger.conditionGroups.flatMap((g) => g.conditions);
  const stopConditions = act.stopTrigger?.conditionGroups.flatMap((g) => g.conditions) ?? [];

  const handleAddStartCondition = () => {
    const store = storeApi.getState();
    const trigger = act.startTrigger;
    const group =
      trigger.conditionGroups.length > 0
        ? trigger.conditionGroups[0]
        : store.addConditionGroup(trigger.id);
    store.addCondition(group.id, {
      name: 'SimTime',
      delay: 0,
      conditionEdge: 'none',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    });
  };

  const handleAddStopCondition = () => {
    const store = storeApi.getState();
    let trigger = act.stopTrigger;
    if (!trigger) {
      const newTrigger = { id: crypto.randomUUID(), conditionGroups: [] };
      store.setStopTrigger(act.id, newTrigger);
      trigger = newTrigger;
    }
    const group =
      trigger.conditionGroups.length > 0
        ? trigger.conditionGroups[0]
        : store.addConditionGroup(trigger.id);
    store.addCondition(group.id, {
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

  return (
    <div className="flex flex-col gap-5 p-2">
      {/* Start Trigger */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Start Trigger
          </p>
          <button
            onClick={handleAddStartCondition}
            className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
            title="Add condition"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {startConditions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1">
            No conditions — starts immediately
          </p>
        ) : (
          <div className="space-y-1">
            {startConditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] group/cond"
              >
                <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
                  {getTriggerSummary({
                    id: '',
                    conditionGroups: [{ id: '', conditions: [condition] }],
                  })}
                </span>
                <button
                  onClick={() => handleRemoveCondition(condition.id)}
                  className="ml-2 shrink-0 opacity-0 group-hover/cond:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {startConditions.length > 0 && (
          <div className="pt-1">
            <ConditionPropertyEditor trigger={act.startTrigger} />
          </div>
        )}
      </section>

      {/* Stop Trigger */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Stop Trigger
          </p>
          <button
            onClick={handleAddStopCondition}
            className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
            title="Add stop condition"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {stopConditions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1">
            No stop conditions
          </p>
        ) : (
          <div className="space-y-1">
            {stopConditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] group/cond"
              >
                <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
                  {getTriggerSummary({
                    id: '',
                    conditionGroups: [{ id: '', conditions: [condition] }],
                  })}
                </span>
                <button
                  onClick={() => handleRemoveCondition(condition.id)}
                  className="ml-2 shrink-0 opacity-0 group-hover/cond:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {act.stopTrigger && stopConditions.length > 0 && (
          <div className="pt-1">
            <ConditionPropertyEditor trigger={act.stopTrigger} />
          </div>
        )}
      </section>
    </div>
  );
}
