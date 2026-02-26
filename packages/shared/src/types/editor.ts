/**
 * Editor-specific types (UI state, not part of OpenSCENARIO spec).
 */

export interface EditorSelection {
  selectedElementIds: string[];
  hoveredElementId: string | null;
  focusedPanelId: string | null;
}

export interface EditorViewport {
  nodeEditorViewport: { x: number; y: number; zoom: number };
  threeDViewport: {
    cameraPosition: [number, number, number];
    cameraTarget: [number, number, number];
  };
  timelineViewport: { scrollX: number; scrollY: number; zoom: number };
}

export type EditorPanel =
  | 'nodeEditor'
  | '3dViewer'
  | 'timeline'
  | 'properties'
  | 'entityList'
  | 'validation'
  | 'templates'
  | 'simulation';

export interface EditorPreferences {
  language: 'en' | 'ja';
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoValidate: boolean;
  showGrid3D: boolean;
  showLaneIds: boolean;
  showRoadIds: boolean;
}
