/**
 * Local Zustand store for the signal assembly visual configurator.
 *
 * Manages editing session state: selected head, undo/redo, view transform, grid snap.
 * Independent from the global preset store — only on "save" does the result
 * flow into the assembly preset store.
 */

import { create } from 'zustand';
import type { AssemblyPreset, AssemblyHeadPlacement } from '@osce/opendrive-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ViewTransform {
  panX: number;
  panY: number;
  zoom: number;
}

export interface AssemblyConfiguratorState {
  // Editing target
  editingPreset: AssemblyPreset | null;
  isNew: boolean;

  // Canvas state
  selectedHeadIndex: number | null;
  viewTransform: ViewTransform;
  gridSnap: boolean;
  gridSize: number; // metres

  // Undo/redo (snapshot-based)
  undoStack: AssemblyPreset[];
  redoStack: AssemblyPreset[];

  // Actions
  startEditing: (preset: AssemblyPreset | null) => void;
  stopEditing: () => void;
  addHead: (presetId: string, x: number, y: number) => void;
  moveHead: (index: number, x: number, y: number) => void;
  removeHead: (index: number) => void;
  selectHead: (index: number | null) => void;
  setName: (name: string) => void;
  toggleGridSnap: () => void;
  setViewTransform: (vt: Partial<ViewTransform>) => void;
  undo: () => void;
  redo: () => void;
  getPreset: () => AssemblyPreset | null;
}

// ---------------------------------------------------------------------------
// Default new preset
// ---------------------------------------------------------------------------

function createNewPreset(): AssemblyPreset {
  return {
    id: `custom-${Date.now()}`,
    name: '',
    heads: [],
  };
}

function clonePreset(p: AssemblyPreset): AssemblyPreset {
  return { ...p, heads: p.heads.map((h) => ({ ...h })) };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_UNDO = 50;

export const useAssemblyConfigurator = create<AssemblyConfiguratorState>((set, get) => {
  /** Push current preset onto undo stack before a mutation. */
  function pushUndo() {
    const { editingPreset, undoStack } = get();
    if (!editingPreset) return;
    const stack = [...undoStack, clonePreset(editingPreset)];
    if (stack.length > MAX_UNDO) stack.shift();
    set({ undoStack: stack, redoStack: [] });
  }

  return {
    editingPreset: null,
    isNew: false,
    selectedHeadIndex: null,
    viewTransform: { panX: 0, panY: 0, zoom: 1 },
    gridSnap: true,
    gridSize: 0.1,
    undoStack: [],
    redoStack: [],

    startEditing: (preset) => {
      const isNew = preset === null;
      const editing = preset ? clonePreset(preset) : createNewPreset();
      set({
        editingPreset: editing,
        isNew,
        selectedHeadIndex: null,
        viewTransform: { panX: 0, panY: 0, zoom: 1 },
        undoStack: [],
        redoStack: [],
      });
    },

    stopEditing: () => {
      set({
        editingPreset: null,
        isNew: false,
        selectedHeadIndex: null,
        undoStack: [],
        redoStack: [],
      });
    },

    addHead: (presetId, x, y) => {
      const { editingPreset, gridSnap, gridSize } = get();
      if (!editingPreset) return;
      pushUndo();
      const snappedX = gridSnap ? Math.round(x / gridSize) * gridSize : x;
      const snappedY = gridSnap ? Math.round(y / gridSize) * gridSize : y;
      const newHead: AssemblyHeadPlacement = { presetId, x: snappedX, y: snappedY };
      set({
        editingPreset: {
          ...editingPreset,
          heads: [...editingPreset.heads, newHead],
        },
        selectedHeadIndex: editingPreset.heads.length,
      });
    },

    moveHead: (index, x, y) => {
      const { editingPreset, gridSnap, gridSize } = get();
      if (!editingPreset || index < 0 || index >= editingPreset.heads.length) return;
      pushUndo();
      const snappedX = gridSnap ? Math.round(x / gridSize) * gridSize : x;
      const snappedY = gridSnap ? Math.round(y / gridSize) * gridSize : y;
      const heads = editingPreset.heads.map((h, i) =>
        i === index ? { ...h, x: snappedX, y: snappedY } : h,
      );
      set({ editingPreset: { ...editingPreset, heads } });
    },

    removeHead: (index) => {
      const { editingPreset, selectedHeadIndex } = get();
      if (!editingPreset || index < 0 || index >= editingPreset.heads.length) return;
      pushUndo();
      const heads = editingPreset.heads.filter((_, i) => i !== index);
      let newSelection = selectedHeadIndex;
      if (selectedHeadIndex === index) newSelection = null;
      else if (selectedHeadIndex !== null && selectedHeadIndex > index) newSelection = selectedHeadIndex - 1;
      set({ editingPreset: { ...editingPreset, heads }, selectedHeadIndex: newSelection });
    },

    selectHead: (index) => set({ selectedHeadIndex: index }),

    setName: (name) => {
      const { editingPreset } = get();
      if (!editingPreset) return;
      set({ editingPreset: { ...editingPreset, name } });
    },

    toggleGridSnap: () => set((s) => ({ gridSnap: !s.gridSnap })),

    setViewTransform: (vt) =>
      set((s) => ({ viewTransform: { ...s.viewTransform, ...vt } })),

    undo: () => {
      const { undoStack, editingPreset, redoStack } = get();
      if (undoStack.length === 0 || !editingPreset) return;
      const prev = undoStack[undoStack.length - 1];
      set({
        editingPreset: prev,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, clonePreset(editingPreset)],
        selectedHeadIndex: null,
      });
    },

    redo: () => {
      const { redoStack, editingPreset, undoStack } = get();
      if (redoStack.length === 0 || !editingPreset) return;
      const next = redoStack[redoStack.length - 1];
      set({
        editingPreset: next,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, clonePreset(editingPreset)],
        selectedHeadIndex: null,
      });
    },

    getPreset: () => get().editingPreset,
  };
});
