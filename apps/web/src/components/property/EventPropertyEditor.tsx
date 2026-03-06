import { Plus, X, Zap } from 'lucide-react';
import type { ScenarioEvent } from '@osce/shared';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';
import { ActionPropertyEditor } from './ActionPropertyEditor';
import { ConditionPropertyEditor } from './ConditionPropertyEditor';
import { getTriggerSummary } from '../scene-composer/trigger-summary';

interface EventPropertyEditorProps {
  event: ScenarioEvent;
}

/**
 * Tabbed Action + Trigger property editor.
 * Shown when selecting an EventRow in the Composer view.
 */
export function EventPropertyEditor({ event }: EventPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  const handlePriorityChange = (value: string) => {
    storeApi.getState().updateEvent(event.id, {
      priority: value as ScenarioEvent['priority'],
    });
  };

  const firstAction = event.actions[0] ?? null;

  const allConditions = event.startTrigger.conditionGroups.flatMap((g) => g.conditions);

  const handleAddCondition = () => {
    const store = storeApi.getState();
    const trigger = event.startTrigger;
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
    <div className="flex flex-col gap-1 p-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
        Action
      </p>
      <Tabs defaultValue="action">
        <TabsList className="w-full">
          <TabsTrigger value="action" className="flex-1 text-[11px]">
            Action
          </TabsTrigger>
          <TabsTrigger value="trigger" className="flex-1 text-[11px]">
            Trigger
          </TabsTrigger>
        </TabsList>

        {/* Action tab */}
        <TabsContent value="action">
          <div className="space-y-3 p-2">
            <div className="grid gap-2">
              <Label className="text-xs">Priority</Label>
              <EnumSelect
                value={event.priority}
                options={EVENT_PRIORITIES}
                onValueChange={handlePriorityChange}
                className="h-8 text-sm"
              />
            </div>

            {firstAction ? (
              <ActionPropertyEditor action={firstAction} />
            ) : (
              <p className="text-xs text-muted-foreground italic">No actions defined</p>
            )}
          </div>
        </TabsContent>

        {/* Trigger tab */}
        <TabsContent value="trigger">
          <div className="space-y-3 p-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Start Trigger
              </p>
              <button
                onClick={handleAddCondition}
                className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
                title="Add condition"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            {allConditions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic px-1">
                No conditions — triggers immediately
              </p>
            ) : (
              <div className="space-y-1">
                {allConditions.map((condition) => (
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

            {allConditions.length > 0 && (
              <ConditionPropertyEditor trigger={event.startTrigger} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
