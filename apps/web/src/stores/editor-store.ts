import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EditorSelection,
  EditorPreferences,
  EditorPanel,
  ValidationResult,
  OpenDriveDocument,
} from '@osce/shared';

/** Request to pick a position from the 3D viewer */
export interface PositionPickRequest {
  targetType: 'worldPosition' | 'lanePosition';
  requestId: string;
}

/** Data returned from picking a position in the 3D viewer */
export interface PickedPositionData {
  requestId: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  heading: number;
  roadId: string;
  laneId: number;
  s: number;
  offset: number;
  roadT: number;
}

export type EditorMode = 'scenario' | 'roadNetwork';

export interface EditorState {
  // Editor mode (Scenario / Road Network tab)
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;

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

  // File state (.xosc)
  currentFileName: string | null;
  setCurrentFileName: (name: string | null) => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // File state (.xodr)
  roadNetworkFileName: string | null;
  setRoadNetworkFileName: (name: string | null) => void;
  isRoadNetworkDirty: boolean;
  setRoadNetworkDirty: (dirty: boolean) => void;

  // File handles for overwrite-save (File System Access API)
  xoscFileHandle: FileSystemFileHandle | null;
  setXoscFileHandle: (handle: FileSystemFileHandle | null) => void;
  xodrFileHandle: FileSystemFileHandle | null;
  setXodrFileHandle: (handle: FileSystemFileHandle | null) => void;

  // Electron file paths for overwrite-save
  xoscFilePath: string | null;
  setXoscFilePath: (path: string | null) => void;
  xodrFilePath: string | null;
  setXodrFilePath: (path: string | null) => void;

  // File handles for .osce.json (editor format)
  osceFileHandle: FileSystemFileHandle | null;
  setOsceFileHandle: (handle: FileSystemFileHandle | null) => void;
  osceFilePath: string | null;
  setOsceFilePath: (path: string | null) => void;

  // SaveAs dialog
  showSaveAs: boolean;
  setShowSaveAs: (show: boolean) => void;
  saveAsFileType: 'xosc' | 'xodr' | 'osce';
  setSaveAsFileType: (type: 'xosc' | 'xodr' | 'osce') => void;

  // Entity property tab persistence
  entityPropertyTab: 'definition' | 'initialState';
  setEntityPropertyTab: (tab: 'definition' | 'initialState') => void;

  // Focus entity in 3D viewer (from panel double-click)
  focusEntityId: string | null;
  setFocusEntityId: (id: string | null) => void;

  // Signal selection (OpenDRIVE signal, separate from scenario element selection)
  selectedSignalKey: string | null;
  setSelectedSignalKey: (key: string | null) => void;

  // Active Act tab in Scene Composer
  activeActId: string | null;
  setActiveActId: (id: string | null) => void;

  // Position pick from 3D viewer
  positionPickRequest: PositionPickRequest | null;
  pickedPosition: PickedPositionData | null;
  requestPositionPick: (req: PositionPickRequest) => void;
  resolvePositionPick: (data: Omit<PickedPositionData, 'requestId'>) => void;
  cancelPositionPick: () => void;

  // Intersection Timeline panel visibility
  showIntersectionTimeline: boolean;
  toggleIntersectionTimeline: () => void;
  setShowIntersectionTimeline: (show: boolean) => void;

  // Selected TrafficSignalController (shared between timeline & properties)
  selectedControllerId: string | null;
  setSelectedControllerId: (id: string | null) => void;

  // Signal IDs to highlight in 3D viewer (set by timeline track selection)
  highlightedSignalIds: ReadonlySet<string> | null;
  setHighlightedSignalIds: (ids: ReadonlySet<string> | null) => void;

  // Reset transient state (preserves preferences, panelVisibility, file state)
  resetTransientState: () => void;

  // Reset file-related state (handles, paths, names, dirty flags, road network)
  resetFileState: () => void;
}

const defaultPreferences: EditorPreferences = {
  language: 'en',
  theme: 'system',
  autoSave: false,
  autoValidate: true,
  showGrid3D: true,
  showLaneIds: false,
  showRoadIds: false,
  compatibilityProfile: {
    oscVersion: '1.3',
    simulator: 'any',
  },
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
      // Editor mode
      editorMode: 'scenario' as EditorMode,
      setEditorMode: (mode) => set({ editorMode: mode }),

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

      // File state (.xosc)
      currentFileName: null,
      setCurrentFileName: (name) => set({ currentFileName: name }),
      isDirty: false,
      setDirty: (dirty) => set({ isDirty: dirty }),

      // File state (.xodr)
      roadNetworkFileName: null,
      setRoadNetworkFileName: (name) => set({ roadNetworkFileName: name }),
      isRoadNetworkDirty: false,
      setRoadNetworkDirty: (dirty) => set({ isRoadNetworkDirty: dirty }),

      // File handles (not persisted)
      xoscFileHandle: null,
      setXoscFileHandle: (handle) => set({ xoscFileHandle: handle }),
      xodrFileHandle: null,
      setXodrFileHandle: (handle) => set({ xodrFileHandle: handle }),

      // Electron file paths (not persisted)
      xoscFilePath: null,
      setXoscFilePath: (path) => set({ xoscFilePath: path }),
      xodrFilePath: null,
      setXodrFilePath: (path) => set({ xodrFilePath: path }),

      // .osce.json file handles/paths
      osceFileHandle: null,
      setOsceFileHandle: (handle) => set({ osceFileHandle: handle }),
      osceFilePath: null,
      setOsceFilePath: (path) => set({ osceFilePath: path }),

      // SaveAs dialog
      showSaveAs: false,
      setShowSaveAs: (show) => set({ showSaveAs: show }),
      saveAsFileType: 'xosc' as const,
      setSaveAsFileType: (type) => set({ saveAsFileType: type }),

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

      // Active Act tab
      activeActId: null,
      setActiveActId: (id) => set({ activeActId: id }),

      // Position pick from 3D viewer
      positionPickRequest: null,
      pickedPosition: null,
      requestPositionPick: (req) => set({ positionPickRequest: req, pickedPosition: null }),
      resolvePositionPick: (data) =>
        set((state) => ({
          pickedPosition: state.positionPickRequest
            ? { ...data, requestId: state.positionPickRequest.requestId }
            : null,
          positionPickRequest: null,
        })),
      cancelPositionPick: () => set({ positionPickRequest: null, pickedPosition: null }),

      // Intersection Timeline
      showIntersectionTimeline: false,
      toggleIntersectionTimeline: () =>
        set((state) => ({ showIntersectionTimeline: !state.showIntersectionTimeline })),
      setShowIntersectionTimeline: (show) => set({ showIntersectionTimeline: show }),

      // Selected controller
      selectedControllerId: null,
      setSelectedControllerId: (id) => set({ selectedControllerId: id, highlightedSignalIds: null }),

      // Highlighted signal IDs
      highlightedSignalIds: null,
      setHighlightedSignalIds: (ids) => set({ highlightedSignalIds: ids }),

      // Reset transient state (preserves preferences, panelVisibility, file state)
      resetTransientState: () =>
        set({
          selection: { selectedElementIds: [], hoveredElementId: null, focusedPanelId: null },
          validationResult: null,
          focusNodeId: null,
          focusEntityId: null,
          selectedSignalKey: null,
          activeActId: null,
          positionPickRequest: null,
          pickedPosition: null,
          showSaveAs: false,
          saveAsFileType: 'xosc' as const,
          selectedControllerId: null,
          highlightedSignalIds: null,
        }),

      // Reset file-related state (for project close / new file)
      resetFileState: () =>
        set({
          xoscFileHandle: null,
          xodrFileHandle: null,
          osceFileHandle: null,
          xoscFilePath: null,
          xodrFilePath: null,
          osceFilePath: null,
          currentFileName: null,
          roadNetworkFileName: null,
          isDirty: false,
          isRoadNetworkDirty: false,
          roadNetwork: null,
          roadNetworkXml: null,
        }),
    }),
    {
      name: 'osce-editor-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        panelVisibility: state.panelVisibility,
        entityPropertyTab: state.entityPropertyTab,
        showIntersectionTimeline: state.showIntersectionTimeline,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<EditorState>;
        return {
          ...current,
          ...(p ?? {}),
          preferences: {
            ...defaultPreferences,
            ...(p?.preferences ?? {}),
          },
        };
      },
    },
  ),
);
