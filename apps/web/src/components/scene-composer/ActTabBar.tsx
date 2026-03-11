import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import type { Act } from '@osce/shared';
import { cn } from '../../lib/utils';

interface ActTabBarProps {
  acts: Act[];
  activeActId: string | null;
  onSelectAct: (actId: string) => void;
  onRenameAct: (actId: string, name: string) => void;
  onAddAct: () => void;
  onRemoveAct: (actId: string) => void;
}

/**
 * Chrome/Excel-style tab bar for switching between Acts.
 * Double-click a tab to rename inline. Click [+] to add. Click × to remove.
 */
export function ActTabBar({
  acts,
  activeActId,
  onSelectAct,
  onRenameAct,
  onAddAct,
  onRemoveAct,
}: ActTabBarProps) {
  return (
    <div className="flex items-end gap-0 border-b border-[var(--color-glass-edge)] bg-[var(--color-glass-1)]/30 px-1 pt-1">
      {acts.map((act) => (
        <ActTab
          key={act.id}
          act={act}
          isActive={act.id === activeActId}
          onSelect={() => onSelectAct(act.id)}
          onRename={(name) => onRenameAct(act.id, name)}
          onRemove={() => onRemoveAct(act.id)}
          canRemove={acts.length > 1}
        />
      ))}

      {/* Add Act button */}
      <button
        type="button"
        onClick={onAddAct}
        className="flex items-center justify-center h-7 w-7 ml-0.5 mb-px rounded-t text-muted-foreground hover:text-[var(--color-accent-vivid)] hover:bg-[var(--color-glass-2)] transition-colors"
        title="Add Act"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Single Tab ───────────────────────────────────────────────────

interface ActTabProps {
  act: Act;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ActTab({ act, isActive, onSelect, onRename, onRemove, canRemove }: ActTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(act.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(act.name);
  }, [act.name]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== act.name) {
      onRename(trimmed);
    } else {
      setDraft(act.name);
    }
    setEditing(false);
  }, [draft, act.name, onRename]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename();
    }
    if (e.key === 'Escape') {
      setDraft(act.name);
      setEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'group/tab relative flex items-center gap-1 px-3 h-7 text-[11px] font-medium cursor-pointer rounded-t select-none transition-colors',
        isActive
          ? 'bg-[var(--color-glass-2)] border border-b-0 border-[var(--color-glass-edge)] text-[var(--color-text-primary)] -mb-px z-10'
          : 'text-muted-foreground hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]/50 border border-transparent',
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-20 px-1 py-0 text-[11px] bg-transparent border-b border-[var(--color-accent-vivid)] outline-none text-[var(--color-text-primary)]"
        />
      ) : (
        <span className="truncate max-w-[120px]">{act.name}</span>
      )}

      {/* Close button */}
      {canRemove && !editing && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="shrink-0 p-0.5 rounded opacity-0 group-hover/tab:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          title="Remove Act"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
