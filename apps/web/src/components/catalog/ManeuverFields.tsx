import { useTranslation } from '@osce/i18n';
import { Plus, Trash2, ChevronUp, ChevronDown, Clock, Zap, ChevronRight, Settings } from 'lucide-react';
import type { Maneuver, CatalogEntry } from '@osce/shared';
import { cn } from '@/lib/utils';
import { ParameterDeclarationsEditor } from './ParameterDeclarationsEditor';
import {
  addManeuverEvent,
  removeManeuverEvent,
  reorderManeuverEvents,
  addEventAction,
  removeEventAction,
} from '../../lib/maneuver-helpers';
import { TriggerSummaryBadges } from '../scene-composer/TriggerSummaryBadges';
import { getActionSummary } from '../scene-composer/action-summary';
import { actionIcons } from '../scene-composer/ActionItem';

interface ManeuverFieldsProps {
  entry: { catalogType: 'maneuver'; definition: Maneuver };
  onUpdate: (entry: CatalogEntry) => void;
  selectedEventIndex: number | null;
  onSelectEvent: (index: number | null) => void;
  onSelectAction: (eventIndex: number, actionIndex: number) => void;
}

export function ManeuverFields({
  entry,
  onUpdate,
  selectedEventIndex,
  onSelectEvent,
  onSelectAction,
}: ManeuverFieldsProps) {
  const { t } = useTranslation('common');
  const maneuver = entry.definition;

  const update = (updated: Maneuver) => {
    onUpdate({ ...entry, definition: updated } as CatalogEntry);
  };

  const handleAddEvent = () => {
    const updated = addManeuverEvent(maneuver);
    update(updated);
    onSelectEvent(updated.events.length - 1);
  };

  const handleRemoveEvent = (index: number) => {
    const updated = removeManeuverEvent(maneuver, index);
    update(updated);
    if (updated.events.length === 0) {
      onSelectEvent(null);
    } else if (selectedEventIndex !== null) {
      if (selectedEventIndex === index) {
        onSelectEvent(Math.min(index, updated.events.length - 1));
      } else if (selectedEventIndex > index) {
        onSelectEvent(selectedEventIndex - 1);
      }
    }
  };

  const handleMoveEvent = (index: number, direction: -1 | 1) => {
    const toIndex = index + direction;
    if (toIndex < 0 || toIndex >= maneuver.events.length) return;
    update(reorderManeuverEvents(maneuver, index, toIndex));
    if (selectedEventIndex === index) onSelectEvent(toIndex);
  };

  const handleAddAction = (eventIndex: number) => {
    const event = maneuver.events[eventIndex];
    const updatedEvent = addEventAction(event);
    const events = [...maneuver.events];
    events[eventIndex] = updatedEvent;
    update({ ...maneuver, events });
  };

  const handleRemoveAction = (eventIndex: number, actionIndex: number) => {
    const event = maneuver.events[eventIndex];
    const updatedEvent = removeEventAction(event, actionIndex);
    const events = [...maneuver.events];
    events[eventIndex] = updatedEvent;
    update({ ...maneuver, events });
  };

  return (
    <>
      {/* Parameter Declarations */}
      <ParameterDeclarationsEditor
        parameters={maneuver.parameterDeclarations}
        onChange={(params) => update({ ...maneuver, parameterDeclarations: params })}
      />

      {/* Events section */}
      <div className="flex flex-col pb-1">
        {maneuver.events.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic px-2 py-2">
            {t('catalog.noEvents')}
          </p>
        ) : (
          maneuver.events.map((event, index) => {
            const isSelected = selectedEventIndex === index;
            const hasCondition =
              event.startTrigger.conditionGroups.length > 0 &&
              event.startTrigger.conditionGroups.some((g) => g.conditions.length > 0);
            return (
              <div key={event.id} className="flex flex-col">
                {/* Trigger row */}
                <div
                  className={cn(
                    'group/trigger flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors',
                    'border border-transparent',
                    isSelected
                      ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
                      : 'hover:bg-[var(--color-glass-2)]',
                  )}
                  onClick={() => onSelectEvent(index)}
                >
                  {/* Trigger icon */}
                  {hasCondition ? (
                    <Clock className="h-3 w-3 shrink-0 text-[var(--color-accent-vivid)]" />
                  ) : (
                    <Zap className="h-3 w-3 shrink-0 text-[var(--color-accent-vivid)]" />
                  )}

                  {/* Trigger summary */}
                  <div className="flex-1 min-w-0 flex items-start gap-1">
                    <TriggerSummaryBadges trigger={event.startTrigger} t={t} />
                    <ChevronRight className="h-2.5 w-2.5 shrink-0 text-[var(--color-text-muted)] mt-0.5" />
                  </div>

                  {/* Hover controls: move + delete */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/trigger:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveEvent(index, -1);
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
                        handleMoveEvent(index, 1);
                      }}
                      disabled={index === maneuver.events.length - 1}
                      className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                    >
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEvent(index);
                      }}
                      className="p-0.5 text-[var(--color-text-muted)] hover:text-destructive transition-all"
                      title={t('catalog.removeEvent')}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {/* Action list (indented) */}
                {event.actions.map((action, actionIdx) => {
                  const Icon = actionIcons[action.action.type] ?? Settings;
                  return (
                    <div
                      key={action.id}
                      className="group/action flex items-center gap-2 pl-10 pr-2 py-1 cursor-pointer transition-colors hover:bg-[var(--color-glass-2)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAction(index, actionIdx);
                      }}
                    >
                      <Icon className="h-3 w-3 shrink-0 text-[var(--color-accent-1)]" />
                      <span className="text-[11px] text-[var(--color-text-primary)] truncate flex-1">
                        {getActionSummary(action)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAction(index, actionIdx);
                        }}
                        className="shrink-0 p-0.5 opacity-0 group-hover/action:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
                        title={t('catalog.removeAction')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* + Add Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAction(index);
                  }}
                  className="flex items-center gap-1.5 pl-10 pr-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  {t('catalog.addAction')}
                </button>
              </div>
            );
          })
        )}

        {/* + Add Event */}
        <button
          type="button"
          onClick={handleAddEvent}
          className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
        >
          <Plus className="h-2.5 w-2.5" />
          {t('catalog.addEvent')}
        </button>
      </div>
    </>
  );
}
