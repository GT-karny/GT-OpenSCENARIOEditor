/**
 * Main container for the signal assembly visual configurator.
 *
 * Vertical stack layout:
 * 1. Header: name input + save/cancel
 * 2. Toolbar: grid snap toggle + undo/redo
 * 3. SVG Canvas (flex-1)
 * 4. Properties panel (when head selected)
 * 5. Palette strip (fixed height)
 */

import { useEffect, useCallback } from 'react';
import { Grid3x3, Undo2, Redo2, X } from 'lucide-react';
import type { AssemblyPreset } from '@osce/opendrive-engine';
import { useAssemblyConfigurator } from './useAssemblyConfigurator';
import { AssemblyCanvas } from './AssemblyCanvas';
import { AssemblyHeadPalette } from './AssemblyHeadPalette';
import { AssemblyHeadProperties } from './AssemblyHeadProperties';
import { cn } from '@/lib/utils';

interface SignalAssemblyConfiguratorProps {
  /** Preset to edit, or null for new. */
  preset: AssemblyPreset | null;
  onSave: (preset: AssemblyPreset) => void;
  onCancel: () => void;
}

export function SignalAssemblyConfigurator({
  preset,
  onSave,
  onCancel,
}: SignalAssemblyConfiguratorProps) {
  const {
    editingPreset,
    selectedHeadIndex,
    viewTransform,
    gridSnap,
    gridSize,
    undoStack,
    redoStack,
    startEditing,
    stopEditing,
    addHead,
    moveHead,
    removeHead,
    selectHead,
    setName,
    toggleGridSnap,
    setViewTransform,
    undo,
    redo,
  } = useAssemblyConfigurator();

  // Initialize editing when preset prop changes
  useEffect(() => {
    startEditing(preset);
    return () => stopEditing();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y / Delete)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedHeadIndex !== null) {
          e.preventDefault();
          removeHead(selectedHeadIndex);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, removeHead, selectedHeadIndex]);

  const handleSave = useCallback(() => {
    if (!editingPreset || !editingPreset.name.trim()) return;
    onSave(editingPreset);
  }, [editingPreset, onSave]);

  if (!editingPreset) return null;

  const selectedHead =
    selectedHeadIndex !== null && selectedHeadIndex < editingPreset.heads.length
      ? editingPreset.heads[selectedHeadIndex]
      : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-glass-edge)] flex items-center gap-2">
        <input
          className="flex-1 h-6 px-2 text-[11px] rounded-none bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          placeholder="Assembly name"
          value={editingPreset.name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="h-6 px-2 text-[10px] rounded-none bg-[var(--color-accent-vivid)] text-[var(--color-bg-primary)] hover:opacity-90 disabled:opacity-40"
          onClick={handleSave}
          disabled={!editingPreset.name.trim() || editingPreset.heads.length === 0}
        >
          Save
        </button>
        <button
          type="button"
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          onClick={onCancel}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-3 py-1 border-b border-[var(--color-glass-edge)] flex items-center gap-1">
        <ToolbarButton
          icon={Grid3x3}
          active={gridSnap}
          onClick={toggleGridSnap}
          title="Grid snap"
        />
        <div className="w-px h-4 bg-[var(--color-glass-edge)] mx-1" />
        <ToolbarButton
          icon={Undo2}
          active={false}
          disabled={undoStack.length === 0}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton
          icon={Redo2}
          active={false}
          disabled={redoStack.length === 0}
          onClick={redo}
          title="Redo (Ctrl+Y)"
        />
        <div className="flex-1" />
        <span className="text-[8px] text-[var(--color-text-tertiary)]">
          {editingPreset.heads.length} head{editingPreset.heads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Canvas */}
      <AssemblyCanvas
        heads={editingPreset.heads}
        selectedHeadIndex={selectedHeadIndex}
        viewTransform={viewTransform}
        gridSnap={gridSnap}
        gridSize={gridSize}
        onSelectHead={selectHead}
        onMoveHead={moveHead}
        onAddHead={addHead}
        setViewTransform={setViewTransform}
      />

      {/* Properties (when head selected) */}
      {selectedHead && (
        <AssemblyHeadProperties
          head={selectedHead}
          index={selectedHeadIndex!}
          onMove={moveHead}
          onRemove={removeHead}
        />
      )}

      {/* Palette */}
      <AssemblyHeadPalette />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolbarButton({
  icon: Icon,
  active,
  disabled,
  onClick,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        'p-1 rounded-none transition-colors',
        active
          ? 'text-[var(--color-accent-vivid)] bg-[var(--color-glass-hover)]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)]',
        disabled && 'opacity-30 pointer-events-none',
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
