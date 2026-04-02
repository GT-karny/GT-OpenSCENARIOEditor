import { useState } from 'react';
import { GripVertical, Clock, Zap, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import type { ScenarioEvent } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useFlashState } from '../../hooks/use-flash-state';
import { useCopyPaste } from '../../hooks/use-clipboard';
import { useClipboardStore } from '../../stores/clipboard-store';
import { TriggerSummaryBadges } from './TriggerSummaryBadges';
import { ActionItem } from './ActionItem';
import { ComposerContextMenu } from './ComposerContextMenu';
import type { ComposerMenuPosition } from './ComposerContextMenu';
import { isCustomName } from './name-utils';

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
  activeSimIds?: Set<string>;
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
  activeSimIds,
}: EventRowProps) {
  const { t } = useTranslation('composer');
  const [ctxMenu, setCtxMenu] = useState<ComposerMenuPosition | null>(null);
  const { copyElement, duplicateElement, pasteAtSelection, canPasteAtSelection } = useCopyPaste();
  const hasClipboard = useClipboardStore((s) => s.copiedItem !== null);

  const hasCondition =
    event.startTrigger.conditionGroups.length > 0 &&
    event.startTrigger.conditionGroups.some((g) => g.conditions.length > 0);

  const isEventSelected = selectedEventId === event.id;
  const isEventRunning = activeSimIds?.has(event.id) ?? false;
  const eventFlash = useFlashState(isEventRunning);

  return (
    <div className="flex flex-col">
      {/* Trigger row */}
      <div
        className={cn(
          'group/trigger flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors',
          'border border-transparent',
          isEventSelected
            ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
            : eventFlash === 'running'
              ? 'bg-emerald-400/8 border-emerald-400/25'
              : eventFlash === 'fading'
                ? 'sim-flash-fade'
                : 'hover:bg-[var(--color-glass-2)]',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEvent(event.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        {...dragHandleProps}
      >
        {/* Drag handle */}
        <GripVertical className="h-3 w-3 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover/trigger:opacity-40 cursor-grab" />

        {/* Trigger icon */}
        {eventFlash !== 'idle' && (
          <span className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400',
            eventFlash === 'running' && 'animate-pulse',
          )} />
        )}
        {hasCondition ? (
          <Clock className={cn('h-3 w-3 shrink-0', eventFlash !== 'idle' ? 'text-emerald-400' : 'text-[var(--color-accent-vivid)]')} />
        ) : (
          <Zap className={cn('h-3 w-3 shrink-0', eventFlash !== 'idle' ? 'text-emerald-400' : 'text-[var(--color-accent-vivid)]')} />
        )}

        {/* Event name (shown only when user has set a custom name) + Trigger summary */}
        <div className="flex-1 min-w-0 flex items-start gap-1">
          {isCustomName(event.name, 'event') && (
            <span className="text-[11px] font-semibold text-[var(--color-accent-1)] shrink-0">
              {event.name}:
            </span>
          )}
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
          running={activeSimIds?.has(action.id) ?? false}
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

      {/* Context menu */}
      {ctxMenu && (
        <ComposerContextMenu
          position={ctxMenu}
          onDuplicate={() => duplicateElement(event.id)}
          onCopy={() => copyElement(event.id)}
          onPaste={hasClipboard ? () => pasteAtSelection(event.id) : undefined}
          canPaste={canPasteAtSelection(event.id)}
          onDelete={() => onRemoveEvent(event.id)}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
