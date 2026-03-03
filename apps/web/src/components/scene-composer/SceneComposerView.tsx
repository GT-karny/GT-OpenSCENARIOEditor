import { Car, Plus } from 'lucide-react';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { EntityBehaviorCard } from './EntityBehaviorCard';
import { InitEntityCard } from './InitEntityCard';
import type { ManeuverGroup } from '@osce/shared';

/**
 * Simplified Composer view — shows the Storyboard as entity-based behavior cards.
 *
 * Hierarchy mapping:
 *   Story/Act/Maneuver → auto-generated / hidden
 *   ManeuverGroup      → "Entity Behavior" card (visible)
 *   Event + Action     → Action row within card (visible)
 */
export function SceneComposerView() {
  const storeApi = useScenarioStoreApi();
  const stories = useScenarioStore((s) => s.document.storyboard.stories);
  const entityActions = useScenarioStore((s) => s.document.storyboard.init.entityActions);
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);

  // Collect all ManeuverGroups across all stories/acts (flattened view)
  const allGroups: ManeuverGroup[] = [];
  for (const story of stories) {
    for (const act of story.acts) {
      for (const group of act.maneuverGroups) {
        allGroups.push(group);
      }
    }
  }

  const handleSelectGroup = (groupId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [groupId] });
  };

  /** Ensure Story → Act exist, then add a ManeuverGroup */
  const handleAddBehavior = () => {
    const store = storeApi.getState();

    // Ensure at least one Story
    let story = store.document.storyboard.stories[0];
    if (!story) {
      story = store.addStory({ name: 'MainStory' });
    }

    // Ensure at least one Act
    let act = story.acts[0];
    if (!act) {
      act = store.addAct(story.id, { name: 'MainAct' });
    }

    // Add a new ManeuverGroup
    const group = store.addManeuverGroup(act.id, { name: `Behavior_${allGroups.length + 1}` });
    useEditorStore.getState().setSelection({ selectedElementIds: [group.id] });
  };

  const handleSelectEntityInit = (entityInitId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [entityInitId] });
  };

  // Empty state
  if (allGroups.length === 0 && entityActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Car className="h-10 w-10 text-[var(--color-text-muted)] opacity-20" />
        <p className="text-sm text-[var(--color-text-muted)]">No entity behaviors defined</p>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs text-center opacity-60">
          Add a behavior group to define what each entity does during the scenario
        </p>
        <button
          onClick={handleAddBehavior}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-1)]/10 border border-[var(--color-accent-1)]/30 text-[var(--color-accent-1)] text-sm hover:bg-[var(--color-accent-1)]/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Entity Behavior
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col gap-4 p-4">
        {/* Init section */}
        {entityActions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-1">
              Initial State
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {entityActions.map((ea) => (
                <InitEntityCard
                  key={ea.id}
                  entityInit={ea}
                  selected={selectedIds.includes(ea.id)}
                  onSelect={() => handleSelectEntityInit(ea.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Behaviors section */}
        <div>
          {(entityActions.length > 0 || allGroups.length > 0) && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-1">
              Entity Behaviors
            </p>
          )}
          <div className="flex flex-wrap items-start gap-4">
            {allGroups.map((group) => (
              <EntityBehaviorCard
                key={group.id}
                group={group}
                selected={selectedIds.includes(group.id)}
                onSelect={() => handleSelectGroup(group.id)}
              />
            ))}

            {/* Add behavior button */}
            <button
              onClick={handleAddBehavior}
              className="flex flex-col items-center justify-center w-72 min-h-[100px] rounded-xl border border-dashed border-[var(--color-border-glass)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-1)]/60 hover:text-[var(--color-accent-1)] transition-all gap-2"
              title="Add entity behavior group"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Add Entity Behavior</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
