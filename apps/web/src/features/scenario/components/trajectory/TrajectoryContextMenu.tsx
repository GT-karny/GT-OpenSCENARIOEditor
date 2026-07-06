/**
 * Right-click context menu for trajectory point markers.
 * Provides select, insert after, and delete actions.
 */

import { useEffect, useRef } from 'react';
import { MousePointer2, Plus, Trash2 } from 'lucide-react';

interface TrajectoryContextMenuProps {
  x: number;
  y: number;
  pointIndex: number;
  onSelect: () => void;
  onInsertAfter: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TrajectoryContextMenu({
  x,
  y,
  pointIndex,
  onSelect,
  onInsertAfter,
  onDelete,
  onClose,
}: TrajectoryContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 100,
      }}
      className="min-w-[160px] rounded-none border border-[var(--color-glass-edge)] bg-[var(--color-popover)] py-1 text-xs shadow-lg backdrop-blur-[28px]"
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
        onClick={() => {
          onSelect();
          onClose();
        }}
      >
        <MousePointer2 className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
        Select Point #{pointIndex + 1}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
        onClick={() => {
          onInsertAfter();
          onClose();
        }}
      >
        <Plus className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
        Insert After
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-destructive hover:bg-[var(--color-glass-hover)] transition-colors"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Point
      </button>
    </div>
  );
}
