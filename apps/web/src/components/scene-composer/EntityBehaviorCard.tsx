import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import type { ManeuverGroup, ScenarioEvent } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { EntityIcon } from '../entity/EntityIcon';
import { ManeuverSection } from './ManeuverSection';
import { getActionShortLabel } from './action-summary';

interface EntityBehaviorCardProps {
  group: ManeuverGroup;
  selected: boolean;
  onSelect: () => void;
  activeSimIds?: Set<string>;
  onSeekToElement?: (elementId: string) => void;
}

/**
 * Trigger-centric card representing a ManeuverGroup in the composer view.
 *
 * Header: actor icons + names (line 1), ManeuverGroup name (line 2, editable)
 * Body: EventRow list (trigger → actions), drag-and-drop reorderable
 * Collapsed: name + action summary tags
 */
export function EntityBehaviorCard({ group, selected, onSelect, activeSimIds, onSeekToElement }: EntityBehaviorCardProps) {
  const { t } = useTranslation('composer');
  const storeApi = useScenarioStoreApi();
  const entities = useScenarioStore((s) => s.document.entities);
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftName(group.name);
  }, [group.name]);
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

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
    if (e.key === 'Escape') {
      setDraftName(group.name);
      setEditingName(false);
    }
  };

  // Flatten all events from all maneuvers in this group
  const allEvents: ScenarioEvent[] = group.maneuvers.flatMap((m) => m.events);

  // Resolve actor entity types for header icons
  const actorEntities = group.actors.entityRefs.map((ref) => {
    const entity = entities.find((e) => e.name === ref);
    return { name: ref, type: entity?.type ?? 'miscObject' as const };
  });

  const actorLabel =
    actorEntities.length > 0
      ? null // rendered as icons
      : group.actors.selectTriggeringEntities
        ? t('card.triggeringEntities')
        : t('card.noActors');

  // Collapsed state: action summary tags
  const collapsedTags = useCallback(() => {
    const labels = allEvents.flatMap((ev) =>
      ev.actions.map((a) => getActionShortLabel(a, t)),
    );
    // Deduplicate
    return [...new Set(labels)].join(' \u2022 ');
  }, [allEvents, t]);

  // --- Event handlers ---

  const handleSelectEvent = (eventId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [eventId] });
    onSeekToElement?.(eventId);
  };

  const handleSelectAction = (actionId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [actionId] });
    onSeekToElement?.(actionId);
  };

  const handleRemoveEvent = (eventId: string) => {
    storeApi.getState().removeEvent(eventId);
    if (selectedIds.includes(eventId)) {
      useEditorStore.getState().clearSelection();
    }
  };

  const handleAddAction = (eventId: string) => {
    const store = storeApi.getState();
    const event = allEvents.find((ev) => ev.id === eventId);
    store.addAction(eventId, { name: `Action_${(event?.actions.length ?? 0) + 1}` });
  };

  const handleRemoveAction = (actionId: string) => {
    storeApi.getState().removeAction(actionId);
    if (selectedIds.includes(actionId)) {
      useEditorStore.getState().clearSelection();
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.getState().removeManeuverGroup(group.id);
    if (selected) useEditorStore.getState().clearSelection();
  };

  const handleAddManeuver = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.getState().addManeuver(group.id, {
      name: `Maneuver_${group.maneuvers.length + 1}`,
    });
  };

  // --- Hover → 3D viewer ---

  const handleMouseEnter = () => {
    const firstActor = group.actors.entityRefs[0];
    if (firstActor) {
      useEditorStore.getState().setSelection({ hoveredElementId: firstActor });
    }
  };

  const handleMouseLeave = () => {
    useEditorStore.getState().setSelection({ hoveredElementId: null });
  };

  // Determine selected event/action for highlight
  const selectedEventId = selectedIds.find((id) =>
    allEvents.some((ev) => ev.id === id),
  ) ?? null;
  const selectedActionId = selectedIds.find((id) =>
    allEvents.some((ev) => ev.actions.some((a) => a.id === id)),
  ) ?? null;

  // Check if this ManeuverGroup or any of its children is running in simulation
  const isGroupRunning = activeSimIds?.has(group.id) ?? false;

  return (
    <div
      className={cn(
        'glass-item flex flex-col w-72 shrink-0 group/card transition-shadow',
        selected && 'selected border-l-2 border-l-[var(--color-accent-1)]',
        isGroupRunning && !selected && 'border-l-2 border-l-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
      )}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-1">
        {/* Collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Actor icons + names */}
        <div className="flex-1 min-w-0">
          {actorEntities.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {actorEntities.map((actor) => (
                <span
                  key={actor.name}
                  className="flex items-center gap-1 cursor-pointer"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const entity = entities.find((ent) => ent.name === actor.name);
                    if (entity) {
                      useEditorStore.getState().setFocusEntityId(entity.id);
                    }
                  }}
                >
                  <EntityIcon type={actor.type} className="h-3.5 w-3.5 text-[var(--color-accent-1)]" />
                  <span className="text-[11px] text-[var(--color-text-primary)]">
                    {actor.name}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-[var(--color-text-muted)]">{actorLabel}</span>
          )}
        </div>

        {/* Delete button */}
        {!editingName && (
          <button
            onClick={handleDeleteGroup}
            className="shrink-0 p-0.5 rounded opacity-0 group-hover/card:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
            title={t('card.deleteBehavior')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ManeuverGroup name (line 2) */}
      <div className="px-3 pb-2 pl-[2.125rem]">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-[10px] font-medium outline-none border-b border-[var(--color-accent-vivid)] text-[var(--color-text-secondary)]"
          />
        ) : (
          <span
            className="text-[10px] text-[var(--color-text-muted)] truncate block cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
            title={group.name}
          >
            {group.name}
          </span>
        )}
      </div>

      {/* Collapsed summary */}
      {collapsed && (
        <div className="px-3 pb-2 pl-[2.125rem]">
          <span className="text-[10px] text-[var(--color-text-muted)] opacity-70 truncate block">
            {collapsedTags()}
          </span>
        </div>
      )}

      {/* Maneuver sections */}
      {!collapsed && (
        <div className="pb-2 flex flex-col">
          {group.maneuvers.map((maneuver) => (
            <ManeuverSection
              key={maneuver.id}
              maneuver={maneuver}
              groupId={group.id}
              isOnly={group.maneuvers.length === 1}
              selectedEventId={selectedEventId}
              selectedActionId={selectedActionId}
              onSelectEvent={handleSelectEvent}
              onSelectAction={handleSelectAction}
              onRemoveEvent={handleRemoveEvent}
              onAddAction={handleAddAction}
              onRemoveAction={handleRemoveAction}
              activeSimIds={activeSimIds}
            />
          ))}

          {group.maneuvers.length === 0 && (
            <p className="text-[11px] text-[var(--color-text-muted)] italic px-4 py-1">
              {t('card.noActions')}
            </p>
          )}

          {/* Add maneuver button */}
          <button
            onClick={handleAddManeuver}
            className="flex items-center gap-1.5 px-3 py-1 mt-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            {t('card.addManeuver')}
          </button>
        </div>
      )}
    </div>
  );
}
