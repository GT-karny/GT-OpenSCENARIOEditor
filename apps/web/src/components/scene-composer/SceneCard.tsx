import { useState, useRef, useEffect } from 'react';
import { Trash2, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Act } from '@osce/shared';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

interface SceneCardProps {
  act: Act;
  selected: boolean;
  onSelect: () => void;
}

export function SceneCard({ act, selected, onSelect }: SceneCardProps) {
  const storeApi = useScenarioStoreApi();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(act.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    setDraftName(act.name);
  }, [act.name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== act.name) {
      storeApi.getState().updateAct(act.id, { name: trimmed });
    } else {
      setDraftName(act.name);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') {
      setDraftName(act.name);
      setEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    storeApi.getState().removeAct(act.id);
    if (selected) useEditorStore.getState().clearSelection();
  };

  // Collect unique actor refs across all maneuver groups
  const actorRefs = new Set<string>();
  for (const mg of act.maneuverGroups) {
    for (const ref of mg.actors.entityRefs) actorRefs.add(ref);
    if (mg.actors.selectTriggeringEntities) actorRefs.add('(triggering)');
  }

  const totalEvents = act.maneuverGroups.reduce(
    (sum, mg) => sum + mg.maneuvers.reduce((s, m) => s + m.events.length, 0),
    0,
  );

  return (
    <div
      className={cn(
        'glass-item relative flex flex-col w-52 min-h-[116px] cursor-pointer shrink-0 group/card',
        selected && 'selected',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm font-medium outline-none border-b border-[var(--color-accent-vivid)] text-[var(--color-text-primary)]"
            />
          ) : (
            <span
              className="text-sm font-medium truncate block"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title={act.name}
            >
              {act.name}
            </span>
          )}
        </div>
        {!editing && (
          <button
            onClick={handleDelete}
            className="ml-2 p-0.5 rounded opacity-0 group-hover/card:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            title="Delete scene"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
        {/* Actor badges */}
        {actorRefs.size > 0 ? (
          <div className="flex flex-wrap gap-1">
            {[...actorRefs].slice(0, 4).map((ref) => (
              <span
                key={ref}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-glass-2)] text-muted-foreground font-mono"
              >
                {ref}
              </span>
            ))}
            {actorRefs.size > 4 && (
              <span className="text-[10px] text-muted-foreground">+{actorRefs.size - 4}</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">No actors</span>
        )}

        {/* Stats */}
        <div className="mt-auto flex items-center gap-2 text-[10px] text-muted-foreground">
          <Layers className="h-3 w-3 shrink-0" />
          <span>
            {act.maneuverGroups.length} group{act.maneuverGroups.length !== 1 ? 's' : ''}
          </span>
          {totalEvents > 0 && (
            <span>
              · {totalEvents} event{totalEvents !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
