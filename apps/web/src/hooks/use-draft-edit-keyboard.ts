import { useEffect } from 'react';

/**
 * Shared keyboard handling for draft-edit modes (route editing, trajectory editing).
 *
 * Both editors bind the same shortcuts while active:
 * - Ctrl/Cmd+Z: undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z: redo
 * - Delete / Backspace: remove the currently selected point (editor-specific)
 * - Escape: exit edit mode
 *
 * Typing inside inputs/textareas/contentEditable is ignored so shortcuts never
 * fire while the user is editing a field.
 */
export interface DraftEditKeyboardHandlers {
  active: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Delete the selected point; return true if a deletion was performed. */
  onDeleteSelected: () => boolean;
  onEscape: () => void;
}

export function useDraftEditKeyboard({
  active,
  onUndo,
  onRedo,
  onDeleteSelected,
  onEscape,
}: DraftEditKeyboardHandlers): void {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        onRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onDeleteSelected()) {
          e.preventDefault();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onUndo, onRedo, onDeleteSelected, onEscape]);
}
