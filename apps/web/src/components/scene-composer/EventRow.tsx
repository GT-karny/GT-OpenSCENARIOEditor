import { GripVertical, Clock, Zap, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import type { ScenarioEvent } from '@osce/shared';
import { cn } from '../../lib/utils';
import { TriggerSummaryBadges } from './TriggerSummaryBadges';
import { ActionItem } from './ActionItem';

interface EventRowProps {
  event: ScenarioEvent;
  selectedEventId: string | null;
  selectedActionId: string | null;
  onSelectEvent: (eventId: string) => void;
  onSelectAction: (actionId: string) => void;
  onRemoveEvent: (eventId: string) => void;
  onAddAction: (eventId: string) => void;
  onRemoveAction: (actionId: string) => void;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}

/**
 * Trigger-centric event row in the composer.
 * Shows: [DragHandle] [EventName (TriggerSummary) →]
 *          ├ ActionItem 1
 *          ├ ActionItem 2
 *          └ + Add Action
 */
export function EventRow({
  event,
  selectedEventId,
  selectedActionId,
  onSelectEvent,
  onSelectAction,
  onRemoveEvent,
  onAddAction,
  onRemoveAction,
  dragHandleProps,
}: EventRowProps) {
  const { t } = useTranslation('composer');
  const hasCondition =
    event.startTrigger.conditionGroups.length > 0 &&
    event.startTrigger.conditionGroups.some((g) => g.conditions.length > 0);

  const isEventSelected = selectedEventId === event.id;

  return (
    <div className="flex flex-col">
      {/* Trigger row */}
      <div
        className={cn(
          'group/trigger flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors',
          'border border-transparent',
          isEventSelected
            ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
            : 'hover:bg-[var(--color-glass-2)]',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEvent(event.id);
        }}
        {...dragHandleProps}
      >
        {/* Drag handle */}
        <GripVertical className="h-3 w-3 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover/trigger:opacity-40 cursor-grab" />

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

        {/* Delete event */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveEvent(event.id);
          }}
          className="shrink-0 p-0.5 opacity-0 group-hover/trigger:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
          title={t('card.deleteEvent')}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Action list (indented) */}
      {event.actions.map((action) => (
        <ActionItem
          key={action.id}
          action={action}
          selected={selectedActionId === action.id}
          onSelect={() => onSelectAction(action.id)}
          onRemove={() => onRemoveAction(action.id)}
        />
      ))}

      {/* Add action button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddAction(event.id);
        }}
        className="flex items-center gap-1.5 pl-14 pr-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
      >
        <Plus className="h-2.5 w-2.5" />
        {t('card.addAction')}
      </button>
    </div>
  );
}
