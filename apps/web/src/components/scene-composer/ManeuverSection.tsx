import { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import type { Maneuver } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { EventRow } from './EventRow';

interface ManeuverSectionProps {
  maneuver: Maneuver;
  /** @deprecated Reserved for future cross-Maneuver operations */
  groupId?: string;
  isOnly: boolean;
  selectedEventId: string | null;
  selectedActionId: string | null;
  onSelectEvent: (eventId: string) => void;
  onSelectAction: (actionId: string) => void;
  onRemoveEvent: (eventId: string) => void;
  onAddAction: (eventId: string) => void;
  onRemoveAction: (actionId: string) => void;
  activeSimIds?: Set<string>;
}

/**
 * Glass-panel section within EntityBehaviorCard representing a single Maneuver.
 * Groups Events by intent/purpose (e.g., "Overtake", "EmergencyStop").
 * Always shows header with collapse toggle and editable name.
 * When isOnly=true, the delete button is hidden (cannot remove last Maneuver).
 */
export function ManeuverSection({
  maneuver,
  isOnly,
  selectedEventId,
  selectedActionId,
  onSelectEvent,
  onSelectAction,
  onRemoveEvent,
  onAddAction,
  onRemoveAction,
  activeSimIds,
}: ManeuverSectionProps) {
  const { t } = useTranslation('composer');
  const storeApi = useScenarioStoreApi();
  const selectedIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));

  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(maneuver.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // D&D state (scoped to this Maneuver)
  const [dragEventId, setDragEventId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraftName(maneuver.name);
  }, [maneuver.name]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== maneuver.name) {
      storeApi.getState().updateManeuver(maneuver.id, { name: trimmed });
    } else {
      setDraftName(maneuver.name);
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') {
      setDraftName(maneuver.name);
      setEditingName(false);
    }
  };

  const handleAddEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    const store = storeApi.getState();
    const event = store.addEvent(maneuver.id, {
      name: `Event_${maneuver.events.length + 1}`,
    });
    store.addAction(event.id, { name: `Action_${maneuver.events.length}` });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.getState().removeManeuver(maneuver.id);
    // Clear selection if any child was selected
    const allEventIds = maneuver.events.map((ev) => ev.id);
    const allActionIds = maneuver.events.flatMap((ev) => ev.actions.map((a) => a.id));
    const allIds = [maneuver.id, ...allEventIds, ...allActionIds];
    if (selectedIds.some((id) => allIds.includes(id))) {
      useEditorStore.getState().clearSelection();
    }
  };

  // --- D&D handlers ---
  const handleDragStart = (eventId: string) => (e: React.DragEvent) => {
    setDragEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragEventId(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragEventId) {
      storeApi.getState().reorderEvent(dragEventId, targetIndex);
    }
    setDragEventId(null);
    setDropTargetIndex(null);
  };

  const events = maneuver.events;
  const isManeuverRunning = activeSimIds?.has(maneuver.id) ?? false;

  return (
    <div className={cn(
      'glass-item flex flex-col mx-2 mt-1 transition-shadow',
      isManeuverRunning && 'ring-1 ring-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]',
    )}>
      {/* Maneuver header */}
      <div
        className="group/maneuver flex items-center gap-1.5 px-2 py-1.5 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed(!collapsed);
        }}
      >
        {/* Collapse chevron */}
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
        )}

        {/* Maneuver name */}
        {editingName ? (
          <input
            ref={nameInputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-[11px] font-medium outline-none border-b border-[var(--color-accent-vivid)] text-[var(--color-text-secondary)] min-w-0"
          />
        ) : (
          <span
            className="flex-1 text-[11px] text-[var(--color-text-secondary)] font-medium truncate cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
            title={maneuver.name}
          >
            {maneuver.name}
          </span>
        )}

        {/* Delete button (hidden when sole Maneuver) */}
        {!isOnly && !editingName && (
          <button
            onClick={handleDelete}
            className="shrink-0 p-0.5 opacity-0 group-hover/maneuver:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
            title={t('card.deleteManeuver')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Event list */}
      {!collapsed && (
        <div className="flex flex-col">
          {events.length === 0 ? (
            <p className="text-[11px] text-[var(--color-text-muted)] italic px-4 py-1">
              {t('card.noEvents')}
            </p>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
              >
                {dropTargetIndex === index && dragEventId && (
                  <div className="h-0.5 mx-2 bg-[var(--color-accent-1)] rounded-full" />
                )}

                <EventRow
                  event={event}
                  selectedEventId={selectedEventId}
                  selectedActionId={selectedActionId}
                  onSelectEvent={onSelectEvent}
                  onSelectAction={onSelectAction}
                  onRemoveEvent={onRemoveEvent}
                  onAddAction={onAddAction}
                  onRemoveAction={onRemoveAction}
                  dragHandleProps={{
                    draggable: true,
                    onDragStart: handleDragStart(event.id),
                    onDragEnd: handleDragEnd,
                  }}
                  activeSimIds={activeSimIds}
                />

                {index < events.length - 1 && (
                  <div className="divider-glow mx-2 my-1" />
                )}
              </div>
            ))
          )}

          {/* Add event button */}
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-1.5 pl-8 pr-2 py-1 mt-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            {t('card.addEvent')}
          </button>
        </div>
      )}
    </div>
  );
}
