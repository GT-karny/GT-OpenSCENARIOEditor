/**
 * Local editor UI state types.
 */

export interface NodeEditorSelection {
  selectedElementIds: string[];
  hoveredElementId: string | null;
}

export interface NodeEditorViewport {
  x: number;
  y: number;
  zoom: number;
}
