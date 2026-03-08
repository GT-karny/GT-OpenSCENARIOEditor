import { useState, useEffect } from 'react';
import { useTranslation } from '@osce/i18n';
import { Plus, ChevronUp, ChevronDown, Clock, Zap, ChevronRight, Settings, Trash2 } from 'lucide-react';
import type {
  Maneuver,
  ScenarioEvent,
  ScenarioAction,
  Condition,
  EventPriority,
} from '@osce/shared';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { EnumSelect } from '../property/EnumSelect';
import { ActionPropertyEditor } from '../property/ActionPropertyEditor';
import { TriggerSectionEditor } from '../property/TriggerSectionEditor';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';
import { getActionSummary } from '../scene-composer/action-summary';
import { TriggerSummaryBadges } from '../scene-composer/TriggerSummaryBadges';
import { actionIcons } from '../scene-composer/ActionItem';
import {
  updateManeuverEvent,
  addEventAction,
  removeEventAction,
  updateEventAction,
  reorderEventActions,
} from '../../lib/maneuver-helpers';
import { createConditionFromPartial, createDefaultConditionGroup } from '@osce/scenario-engine';

interface ManeuverEventPanelProps {
  maneuver: Maneuver;
  selectedEventIndex: number | null;
  selectedActionIndex: number | null;
  activeTab: 'event' | 'action';
  onTabChange: (tab: 'event' | 'action') => void;
  onManeuverChange: (maneuver: Maneuver) => void;
  onSelectAction: (index: number | null) => void;
}

export function ManeuverEventPanel({
  maneuver,
  selectedEventIndex,
  selectedActionIndex,
  activeTab,
  onTabChange,
  onManeuverChange,
  onSelectAction,
}: ManeuverEventPanelProps) {
  const { t } = useTranslation('common');
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const event =
    selectedEventIndex !== null ? maneuver.events[selectedEventIndex] : null;

  // Reset condition selection when event changes
  useEffect(() => {
    setSelectedConditionId(null);
  }, [selectedEventIndex]);

  if (!event) {
    return (
      <div className="flex-1 min-w-0 p-4 bg-[var(--color-bg-void,#050311)] flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center max-w-48">
          {t('catalog.noEventSelected')}
        </p>
      </div>
    );
  }

  const selectedAction =
    selectedActionIndex !== null ? event.actions[selectedActionIndex] : null;

  const updateEvent = (updatedEvent: ScenarioEvent) => {
    onManeuverChange(
      updateManeuverEvent(maneuver, selectedEventIndex!, updatedEvent),
    );
  };

  // ── Action CRUD ──────────────────────────────────────────────

  const handleAddAction = () => {
    const updated = addEventAction(event);
    updateEvent(updated);
    onSelectAction(updated.actions.length - 1);
  };

  const handleRemoveAction = (actionIndex: number) => {
    const updated = removeEventAction(event, actionIndex);
    updateEvent(updated);
    if (selectedActionIndex === actionIndex) {
      onSelectAction(updated.actions.length > 0 ? Math.min(actionIndex, updated.actions.length - 1) : null);
    } else if (selectedActionIndex !== null && selectedActionIndex > actionIndex) {
      onSelectAction(selectedActionIndex - 1);
    }
  };

  const handleMoveAction = (actionIndex: number, direction: -1 | 1) => {
    const toIndex = actionIndex + direction;
    if (toIndex < 0 || toIndex >= event.actions.length) return;
    updateEvent(reorderEventActions(event, actionIndex, toIndex));
    if (selectedActionIndex === actionIndex) onSelectAction(toIndex);
  };

  const handleActionClick = (actionIndex: number) => {
    onSelectAction(actionIndex);
    onTabChange('action');
  };

  // ── Action update callback (for ActionPropertyEditor) ──────

  const handleActionUpdate = (actionId: string, partial: Partial<ScenarioAction>) => {
    const actionIndex = event.actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return;
    const updated = updateEventAction(
      event,
      actionIndex,
      { ...event.actions[actionIndex], ...partial } as ScenarioAction,
    );
    updateEvent(updated);
  };

  // ── Condition callbacks (for TriggerSectionEditor) ──────────

  const handleUpdateCondition = (conditionId: string, partial: Partial<Condition>) => {
    const updatedGroups = event.startTrigger.conditionGroups.map((group) => ({
      ...group,
      conditions: group.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...partial } : c,
      ),
    }));
    updateEvent({
      ...event,
      startTrigger: { ...event.startTrigger, conditionGroups: updatedGroups },
    });
  };

  const handleAddConditionToGroup = (groupId: string) => {
    const newCondition = createConditionFromPartial({
      name: 'SimTime',
      delay: 0,
      conditionEdge: 'none',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    });
    const updatedGroups = event.startTrigger.conditionGroups.map((g) =>
      g.id === groupId
        ? { ...g, conditions: [...g.conditions, newCondition] }
        : g,
    );
    updateEvent({
      ...event,
      startTrigger: { ...event.startTrigger, conditionGroups: updatedGroups },
    });
  };

  const handleAddOrGroup = () => {
    const newGroup = createDefaultConditionGroup();
    const newCondition = createConditionFromPartial({
      name: 'SimTime',
      delay: 0,
      conditionEdge: 'none',
      condition: {
        kind: 'byValue',
        valueCondition: { type: 'simulationTime', value: 0, rule: 'greaterThan' },
      },
    });
    const updatedGroups = [
      ...event.startTrigger.conditionGroups,
      { ...newGroup, conditions: [newCondition] },
    ];
    updateEvent({
      ...event,
      startTrigger: { ...event.startTrigger, conditionGroups: updatedGroups },
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    const updatedGroups = event.startTrigger.conditionGroups
      .map((group) => ({
        ...group,
        conditions: group.conditions.filter((c) => c.id !== conditionId),
      }))
      .filter((group) => group.conditions.length > 0);
    updateEvent({
      ...event,
      startTrigger: { ...event.startTrigger, conditionGroups: updatedGroups },
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    const updatedGroups = event.startTrigger.conditionGroups.filter(
      (g) => g.id !== groupId,
    );
    updateEvent({
      ...event,
      startTrigger: { ...event.startTrigger, conditionGroups: updatedGroups },
    });
  };

  const hasCondition =
    event.startTrigger.conditionGroups.length > 0 &&
    event.startTrigger.conditionGroups.some((g) => g.conditions.length > 0);

  return (
    <div className="flex-1 min-w-0 overflow-auto bg-[var(--color-bg-void,#050311)]">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'event' | 'action')}>
        <TabsList className="w-full sticky top-0 z-10">
          <TabsTrigger value="event" className="flex-1 text-[11px]">
            {t('catalog.eventTab')}
          </TabsTrigger>
          <TabsTrigger value="action" className="flex-1 text-[11px]">
            {t('catalog.actionTab')}
          </TabsTrigger>
        </TabsList>

        {/* ── Event Tab ──────────────────────────────────────── */}
        <TabsContent value="event" className="p-3 space-y-4">
          {/* Trigger header (matching EventRow format) */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)]">
            {hasCondition ? (
              <Clock className="h-3 w-3 shrink-0 text-[var(--color-accent-vivid)] mt-0.5" />
            ) : (
              <Zap className="h-3 w-3 shrink-0 text-[var(--color-accent-vivid)] mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <TriggerSummaryBadges trigger={event.startTrigger} t={t} />
            </div>
            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-[var(--color-text-muted)] mt-0.5" />
          </div>

          {/* Event name */}
          <div className="grid gap-1">
            <Label className="text-[10px]">{t('labels.name')}</Label>
            <Input
              value={event.name}
              onChange={(e) => updateEvent({ ...event, name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          {/* Priority + Max Execution Count (compact row) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[10px]">{t('catalog.priority')}</Label>
              <EnumSelect
                value={event.priority}
                options={EVENT_PRIORITIES as unknown as readonly string[]}
                onValueChange={(v) => updateEvent({ ...event, priority: v as EventPriority })}
                className="h-7 text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[10px]">{t('catalog.maxExecutionCount')}</Label>
              <Input
                type="number"
                min={1}
                value={event.maximumExecutionCount ?? ''}
                placeholder="unlimited"
                onChange={(e) =>
                  updateEvent({
                    ...event,
                    maximumExecutionCount: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Actions list */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-muted-foreground">
                {t('catalog.actions')}
              </p>
              <button
                type="button"
                onClick={handleAddAction}
                className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
                title={t('catalog.addAction')}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {event.actions.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic px-1">
                {t('catalog.noActions')}
              </p>
            ) : (
              <div className="space-y-0.5">
                {event.actions.map((action, index) => {
                  const Icon = actionIcons[action.action.type] ?? Settings;
                  return (
                    <div
                      key={action.id}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1 rounded group/action cursor-pointer transition-colors',
                        'border border-transparent',
                        selectedActionIndex === index
                          ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
                          : 'hover:bg-[var(--color-glass-2)]',
                      )}
                      onClick={() => handleActionClick(index)}
                    >
                      <Icon className="h-3 w-3 shrink-0 text-[var(--color-accent-1)]" />
                      <span className="text-[11px] text-[var(--color-text-primary)] truncate flex-1">
                        {getActionSummary(action)}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/action:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveAction(index, -1);
                          }}
                          disabled={index === 0}
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                        >
                          <ChevronUp className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveAction(index, 1);
                          }}
                          disabled={index === event.actions.length - 1}
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                        >
                          <ChevronDown className="h-2.5 w-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAction(index);
                          }}
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trigger section */}
          <TriggerSectionEditor
            trigger={event.startTrigger}
            selectedConditionId={selectedConditionId}
            onSelectCondition={setSelectedConditionId}
            onUpdateCondition={handleUpdateCondition}
            onAddCondition={handleAddConditionToGroup}
            onRemoveCondition={handleRemoveCondition}
            onAddOrGroup={handleAddOrGroup}
            onRemoveGroup={handleRemoveGroup}
          />
        </TabsContent>

        {/* ── Action Tab ─────────────────────────────────────── */}
        <TabsContent value="action" className="p-3">
          {selectedAction ? (
            <ActionPropertyEditor
              action={selectedAction}
              onUpdate={handleActionUpdate}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground text-center">
                {t('catalog.noActions')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
