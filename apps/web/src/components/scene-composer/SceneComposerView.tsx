import { useEffect } from 'react';
import { Car, Plus } from 'lucide-react';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { EntityBehaviorCard } from './EntityBehaviorCard';
import { ActTabBar } from './ActTabBar';
import type { Act } from '@osce/shared';

/**
 * Simplified Composer view — shows the Storyboard as entity-based behavior cards.
 *
 * Hierarchy mapping:
 *   Story/Act         → Tab bar (visible, switchable)
 *   ManeuverGroup     → "Entity Behavior" card (visible)
 *   Event             → Trigger-based row within card (visible)
 *   Action            → Indented action items under event trigger
 */
export function SceneComposerView() {
  const storeApi = useScenarioStoreApi();
  const stories = useScenarioStore((s) => s.document.storyboard.stories);
  const selectedIds = useEditorStore((s) => s.selection.selectedElementIds);
  const activeActId = useEditorStore((s) => s.activeActId);
  const setActiveActId = useEditorStore((s) => s.setActiveActId);

  // Collect all Acts from the first Story (convention: single Story)
  const story = stories[0];
  const acts: Act[] = story?.acts ?? [];

  // Auto-select first Act when activeActId is null or invalid
  useEffect(() => {
    if (acts.length > 0 && (!activeActId || !acts.some((a) => a.id === activeActId))) {
      setActiveActId(acts[0].id);
    }
  }, [acts, activeActId, setActiveActId]);

  const activeAct = acts.find((a) => a.id === activeActId) ?? acts[0];
  const activeGroups = activeAct?.maneuverGroups ?? [];

  const handleSelectGroup = (groupId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [groupId] });
  };

  /** Add a ManeuverGroup to the active Act */
  const handleAddBehavior = () => {
    const store = storeApi.getState();

    // Ensure at least one Story
    let s = store.document.storyboard.stories[0];
    if (!s) {
      s = store.addStory({ name: 'MainStory' });
    }

    // Ensure at least one Act
    let act = activeAct;
    if (!act) {
      act = store.addAct(s.id, { name: 'Act1' });
      setActiveActId(act.id);
    }

    // Add a new ManeuverGroup to the active Act
    const group = store.addManeuverGroup(act.id, {
      name: `Behavior_${activeGroups.length + 1}`,
    });
    useEditorStore.getState().setSelection({ selectedElementIds: [group.id] });
  };

  /** Add a new Act */
  const handleAddAct = () => {
    const store = storeApi.getState();
    let s = store.document.storyboard.stories[0];
    if (!s) {
      s = store.addStory({ name: 'MainStory' });
    }
    const newAct = store.addAct(s.id, { name: `Act${acts.length + 1}` });
    setActiveActId(newAct.id);
  };

  /** Remove an Act */
  const handleRemoveAct = (actId: string) => {
    if (acts.length <= 1) return;
    storeApi.getState().removeAct(actId);
    // Switch to adjacent tab
    if (activeActId === actId) {
      const idx = acts.findIndex((a) => a.id === actId);
      const next = acts[idx + 1] ?? acts[idx - 1];
      if (next) setActiveActId(next.id);
    }
  };

  /** Rename an Act */
  const handleRenameAct = (actId: string, name: string) => {
    storeApi.getState().updateAct(actId, { name });
  };

  // Empty state — no Story at all
  if (acts.length === 0) {
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
    <div className="h-full flex flex-col">
      {/* Act tab bar */}
      <ActTabBar
        acts={acts}
        activeActId={activeActId}
        onSelectAct={(actId) => {
          setActiveActId(actId);
          useEditorStore.getState().setSelection({ selectedElementIds: [actId] });
        }}
        onRenameAct={handleRenameAct}
        onAddAct={handleAddAct}
        onRemoveAct={handleRemoveAct}
      />

      {/* ManeuverGroups for active Act */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 px-1">
              Entity Behaviors
            </p>
            <div className="flex flex-wrap items-start gap-4">
              {activeGroups.map((group) => (
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
    </div>
  );
}
