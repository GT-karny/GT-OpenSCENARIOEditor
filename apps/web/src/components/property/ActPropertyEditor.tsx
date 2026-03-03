import { useState, useRef, useEffect } from 'react';
import { Plus, X, Layers, Zap } from 'lucide-react';
import type { Act } from '@osce/shared';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { getTriggerSummary } from '../scene-composer/trigger-summary';

interface ActPropertyEditorProps {
  act: Act;
}

export function ActPropertyEditor({ act }: ActPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  // ---- Name editing ----
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(act.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraftName(act.name); }, [act.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== act.name) {
      storeApi.getState().updateAct(act.id, { name: trimmed });
    } else {
      setDraftName(act.name);
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') { setDraftName(act.name); setEditingName(false); }
  };

  // ---- Trigger ----
  const allConditions = act.startTrigger.conditionGroups.flatMap((g) => g.conditions);

  const handleAddCondition = () => {
    const store = storeApi.getState();
    const trigger = act.startTrigger;
    const group =
      trigger.conditionGroups.length > 0
        ? trigger.conditionGroups[0]
        : store.addConditionGroup(trigger.id);
    store.addCondition(group.id, {
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

  // ---- Maneuver Groups ----
  const handleAddGroup = () => {
    storeApi.getState().addManeuverGroup(act.id, { name: 'New Group' });
  };

  const handleRemoveGroup = (groupId: string) => {
    storeApi.getState().removeManeuverGroup(groupId);
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Scene Name */}
      <section className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Scene Name
        </p>
        {editingName ? (
          <input
            ref={nameInputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            className="w-full px-2 py-1 text-sm rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge-mid)] outline-none focus:border-[var(--color-accent-vivid)] text-[var(--color-text-primary)]"
          />
        ) : (
          <button
            className="w-full text-left px-2 py-1 text-sm rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)] transition-colors"
            onClick={() => setEditingName(true)}
            title="Click to edit"
          >
            {act.name}
          </button>
        )}
      </section>

      {/* Start Trigger */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Start Trigger
          </p>
          <button
            onClick={handleAddCondition}
            className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
            title="Add SimulationTime condition"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {allConditions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1">
            No conditions — starts immediately
          </p>
        ) : (
          <div className="space-y-1">
            {allConditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] group/cond"
              >
                <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
                  {getTriggerSummary({ id: '', conditionGroups: [{ id: '', conditions: [condition] }] })}
                </span>
                <button
                  onClick={() => handleRemoveCondition(condition.id)}
                  className="ml-2 shrink-0 opacity-0 group-hover/cond:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Maneuver Groups */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3 w-3" />
            Maneuver Groups ({act.maneuverGroups.length})
          </p>
          <button
            onClick={handleAddGroup}
            className="flex items-center gap-1 text-[10px] text-[var(--color-accent-vivid)] hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {act.maneuverGroups.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-1">No maneuver groups</p>
        ) : (
          <div className="space-y-1">
            {act.maneuverGroups.map((mg) => (
              <div
                key={mg.id}
                className="flex items-start justify-between px-2 py-1.5 rounded bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] group/mg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{mg.name}</p>
                  {mg.actors.entityRefs.length > 0 && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                      {mg.actors.entityRefs.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveGroup(mg.id)}
                  className="ml-2 shrink-0 opacity-0 group-hover/mg:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
