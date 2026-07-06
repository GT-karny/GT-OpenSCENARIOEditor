/**
 * Phase header cell with inline editing (name, duration) and a delete button.
 */

import { Trash2 } from 'lucide-react';

export function PhaseHeader({
  name,
  duration,
  widthPercent,
  onNameChange,
  onDurationChange,
  onDelete,
}: {
  name: string;
  duration: number;
  widthPercent: number;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center border-r border-[var(--color-glass-edge)] overflow-hidden group relative py-0.5 px-0.5 gap-0.5"
      style={{ width: `${widthPercent}%`, minWidth: 40 }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-4 w-full px-0.5 text-[8px] text-center bg-transparent border border-transparent hover:border-[var(--color-glass-edge)] focus:border-[var(--color-accent)] focus:bg-[var(--color-glass-2)] rounded-none text-[var(--color-text-secondary)] outline-none transition-colors"
      />
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0)}
          className="h-4 w-10 px-0.5 text-[8px] text-center bg-transparent border border-transparent hover:border-[var(--color-glass-edge)] focus:border-[var(--color-accent)] focus:bg-[var(--color-glass-2)] rounded-none text-[var(--color-text-secondary)] outline-none transition-colors"
          step="any"
          min={0}
        />
        <span className="text-[8px] text-[var(--color-text-secondary)] opacity-60">s</span>
      </div>
      {/* Delete button (hover) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] transition-opacity"
        title="Delete phase"
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}
