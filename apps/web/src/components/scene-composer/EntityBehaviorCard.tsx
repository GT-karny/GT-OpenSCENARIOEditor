import { useState, useRef, useEffect } from 'react';
import { Car, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { ManeuverGroup, ScenarioEvent } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { ActionRow } from './ActionRow';

interface EntityBehaviorCardProps {
  group: ManeuverGroup;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Card representing a ManeuverGroup in the simplified composer view.
 * Shows the assigned entities and a flat list of Event+Action rows.
 */
export function EntityBehaviorCard({ group, selected, onSelect }: EntityBehaviorCardProps) {
  const storeApi = useScenarioStoreApi();
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraftName(group.name); }, [group.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== group.name) {
      storeApi.getState().updateManeuverGroup(group.id, { name: trimmed });
    } else {
      setDraftName(group.name);
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') { setDraftName(group.name); setEditingName(false); }
  };

  // Flatten all events from all maneuvers in this group
  const allEvents: ScenarioEvent[] = group.maneuvers.flatMap((m) => m.events);

  const actorLabel = group.actors.entityRefs.length > 0
    ? group.actors.entityRefs.join(', ')
    : group.actors.selectTriggeringEntities
      ? '(triggering entities)'
      : '(no actors)';

  const handleAddAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const store = storeApi.getState();
    // Get or create a maneuver in this group
    let maneuver = group.maneuvers[0];
    if (!maneuver) {
      maneuver = store.addManeuver(group.id, { name: 'Maneuver' });
    }
    // Add event with default speed action
    const event = store.addEvent(maneuver.id, { name: `Event_${allEvents.length + 1}` });
    store.addAction(event.id, { name: `Action_${allEvents.length + 1}` });
  };

  const handleRemoveEvent = (eventId: string) => {
    storeApi.getState().removeEvent(eventId);
    if (selectedIds.includes(eventId)) {
      useEditorStore.getState().clearSelection();
    }
  };

  const handleSelectEvent = (eventId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [eventId] });
  };

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.getState().removeManeuverGroup(group.id);
    if (selected) useEditorStore.getState().clearSelection();
  };

  return (
    <div
      className={cn(
        'glass-item flex flex-col w-72 shrink-0 group/card',
        selected && 'selected border-l-2 border-l-[var(--color-accent-1)]',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Entity icon + label */}
        <Car className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-1)]" />
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm font-medium outline-none border-b border-[var(--color-accent-vivid)] text-[var(--color-text-primary)]"
            />
          ) : (
            <span
              className="text-sm font-medium truncate block"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
              title={group.name}
            >
              {group.name}
            </span>
          )}
        </div>

        {/* Delete button */}
        {!editingName && (
          <button
            onClick={handleDeleteGroup}
            className="shrink-0 p-0.5 rounded opacity-0 group-hover/card:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
            title="Delete behavior group"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Actor badges */}
      <div className="px-3 pb-2">
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          {actorLabel}
        </span>
      </div>

      {/* Event/Action list */}
      {!collapsed && (
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {allEvents.length === 0 ? (
            <p className="text-[11px] text-[var(--color-text-muted)] italic px-2 py-1">
              No actions defined
            </p>
          ) : (
            allEvents.map((event) => (
              <ActionRow
                key={event.id}
                event={event}
                selected={selectedIds.includes(event.id)}
                onSelect={() => handleSelectEvent(event.id)}
                onRemove={() => handleRemoveEvent(event.id)}
              />
            ))
          )}

          {/* Add action button */}
          <button
            onClick={handleAddAction}
            className="flex items-center gap-1.5 px-2 py-1 mt-1 rounded-md text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Action
          </button>
        </div>
      )}
    </div>
  );
}
