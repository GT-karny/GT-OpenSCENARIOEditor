import { useState, useEffect } from 'react';
import type { ScenarioEvent } from '@osce/shared';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';
import { ActionPropertyEditor } from './ActionPropertyEditor';
import { TriggerSectionEditor } from './TriggerSectionEditor';

interface EventPropertyEditorProps {
  event: ScenarioEvent;
}

/**
 * Tabbed Action + Trigger property editor.
 * Shown when selecting an EventRow in the Composer view.
 */
export function EventPropertyEditor({ event }: EventPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  // Reset condition selection when event changes
  useEffect(() => {
    setSelectedConditionId(null);
  }, [event.id]);

  const handlePriorityChange = (value: string) => {
    storeApi.getState().updateEvent(event.id, {
      priority: value as ScenarioEvent['priority'],
    });
  };

  const firstAction = event.actions[0] ?? null;

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

  const handleUpdateCondition = (conditionId: string, partial: Partial<import('@osce/shared').Condition>) => {
    storeApi.getState().updateCondition(conditionId, partial);
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
              <ActionPropertyEditor
                action={firstAction}
                onUpdate={(actionId, partial) =>
                  storeApi.getState().updateAction(actionId, partial)
                }
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">No actions defined</p>
            )}
          </div>
        </TabsContent>

        {/* Trigger tab */}
        <TabsContent value="trigger">
          <div className="space-y-3 p-2">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
