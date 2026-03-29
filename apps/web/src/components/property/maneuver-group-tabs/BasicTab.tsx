import { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ManeuverGroup } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { useScenarioStore, useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface BasicTabProps {
  group: ManeuverGroup;
}

export function BasicTab({ group }: BasicTabProps) {
  const storeApi = useScenarioStoreApi();
  const entities = useScenarioStore(useShallow((s) => s.document.entities));

  // Name editing
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

  const handleActorToggle = (entityName: string, checked: boolean) => {
    const refs = checked
      ? [...group.actors.entityRefs, entityName]
      : group.actors.entityRefs.filter((r) => r !== entityName);
    storeApi.getState().updateManeuverGroup(group.id, {
      actors: { ...group.actors, entityRefs: refs },
    });
  };

  const handleSelectTriggeringEntities = (checked: boolean) => {
    storeApi.getState().updateManeuverGroup(group.id, {
      actors: { ...group.actors, selectTriggeringEntities: checked },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Name */}
      <section className="space-y-1.5">
        <Label className="text-xs">Name</Label>
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
            {group.name}
          </button>
        )}
      </section>

      {/* Max Execution Count */}
      <section className="space-y-1.5">
        <Label className="text-xs">Max Execution Count</Label>
        <Input
          type="number"
          min={1}
          value={group.maximumExecutionCount}
          onChange={(e) =>
            storeApi.getState().updateManeuverGroup(group.id, {
              maximumExecutionCount: parseInt(e.target.value) || 1,
            })
          }
          className="h-8 text-sm"
        />
      </section>

      {/* Actors */}
      <section className="space-y-2">
        <Label className="text-xs">Actors</Label>
        {entities.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">No entities defined</p>
        ) : (
          <div className="space-y-1.5">
            {entities.map((entity) => (
              <label
                key={entity.id}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--color-glass-2)] transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={group.actors.entityRefs.includes(entity.name)}
                  onChange={(e) => handleActorToggle(entity.name, e.target.checked)}
                  className="accent-[var(--color-accent-vivid)]"
                />
                <span className="text-xs">{entity.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* Select Triggering Entities */}
        <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--color-glass-2)] transition-colors cursor-pointer border-t border-[var(--color-glass-edge)] pt-2 mt-1">
          <input
            type="checkbox"
            checked={group.actors.selectTriggeringEntities}
            onChange={(e) => handleSelectTriggeringEntities(e.target.checked)}
            className="accent-[var(--color-accent-vivid)]"
          />
          <span className="text-xs text-muted-foreground">Select Triggering Entities</span>
        </label>
      </section>
    </div>
  );
}
