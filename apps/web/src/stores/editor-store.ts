import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EditorSelection,
  EditorPreferences,
  EditorPanel,
  ValidationResult,
  OpenDriveDocument,
} from '@osce/shared';

export interface EditorState {
  // Selection
  selection: EditorSelection;
  setSelection: (sel: Partial<EditorSelection>) => void;
  clearSelection: () => void;

  // Preferences (persisted to localStorage)
  preferences: EditorPreferences;
  updatePreferences: (prefs: Partial<EditorPreferences>) => void;

  // Validation
  validationResult: ValidationResult | null;
  setValidationResult: (result: ValidationResult | null) => void;

  // Node focus (navigation from validation errors)
  focusNodeId: string | null;
  setFocusNodeId: (id: string | null) => void;

  // Road Network (loaded .xodr)
  roadNetwork: OpenDriveDocument | null;
  roadNetworkXml: string | null;
  setRoadNetwork: (doc: OpenDriveDocument | null, rawXml?: string | null) => void;

  // Panel visibility
  panelVisibility: Record<EditorPanel, boolean>;
  togglePanel: (panel: EditorPanel) => void;

  // File state
  currentFileName: string | null;
  setCurrentFileName: (name: string | null) => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // SaveAs dialog
  showSaveAs: boolean;
  setShowSaveAs: (show: boolean) => void;

  // Entity property tab persistence
  entityPropertyTab: 'definition' | 'initialState';
  setEntityPropertyTab: (tab: 'definition' | 'initialState') => void;

  // Focus entity in 3D viewer (from panel double-click)
  focusEntityId: string | null;
  setFocusEntityId: (id: string | null) => void;

  // Signal selection (OpenDRIVE signal, separate from scenario element selection)
  selectedSignalKey: string | null;
  setSelectedSignalKey: (key: string | null) => void;
}

const defaultPreferences: EditorPreferences = {
  language: 'en',
  theme: 'system',
  autoSave: false,
  autoValidate: true,
  showGrid3D: true,
  showLaneIds: false,
  showRoadIds: false,
};

const defaultPanelVisibility: Record<EditorPanel, boolean> = {
  nodeEditor: true,
  '3dViewer': true,
  timeline: true,
  properties: true,
  entityList: true,
  validation: true,
  templates: true,
  simulation: false,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      // Selection
      selection: { selectedElementIds: [], hoveredElementId: null, focusedPanelId: null },
      setSelection: (sel) =>
        set((state) => ({
          selection: { ...state.selection, ...sel },
          // Clear signal selection when scenario element is selected
          selectedSignalKey:
            sel.selectedElementIds && sel.selectedElementIds.length > 0
              ? null
              : state.selectedSignalKey,
        })),
      clearSelection: () =>
        set({
          selection: { selectedElementIds: [], hoveredElementId: null, focusedPanelId: null },
          selectedSignalKey: null,
        }),

      // Preferences
      preferences: defaultPreferences,
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      // Validation
      validationResult: null,
      setValidationResult: (result) => set({ validationResult: result }),

      // Node focus
      focusNodeId: null,
      setFocusNodeId: (id) => set({ focusNodeId: id }),

      // Road Network
      roadNetwork: null,
      roadNetworkXml: null,
      setRoadNetwork: (doc, rawXml) => set({ roadNetwork: doc, roadNetworkXml: rawXml ?? null }),

      // Panel visibility
      panelVisibility: defaultPanelVisibility,
      togglePanel: (panel) =>
        set((state) => ({
          panelVisibility: {
            ...state.panelVisibility,
            [panel]: !state.panelVisibility[panel],
          },
        })),

      // File state
      currentFileName: null,
      setCurrentFileName: (name) => set({ currentFileName: name }),
      isDirty: false,
      setDirty: (dirty) => set({ isDirty: dirty }),

      // SaveAs dialog
      showSaveAs: false,
      setShowSaveAs: (show) => set({ showSaveAs: show }),

      // Entity property tab persistence
      entityPropertyTab: 'definition',
      setEntityPropertyTab: (tab) => set({ entityPropertyTab: tab }),

      // Focus entity in 3D viewer
      focusEntityId: null,
      setFocusEntityId: (id) => set({ focusEntityId: id }),

      // Signal selection
      selectedSignalKey: null,
      setSelectedSignalKey: (key) =>
        set({
          selectedSignalKey: key,
          // Clear entity selection when signal is selected
          ...(key
            ? { selection: { selectedElementIds: [], hoveredElementId: null, focusedPanelId: null } }
            : {}),
        }),
    }),
    {
      name: 'osce-editor-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        panelVisibility: state.panelVisibility,
        entityPropertyTab: state.entityPropertyTab,
      }),
    },
  ),
);
