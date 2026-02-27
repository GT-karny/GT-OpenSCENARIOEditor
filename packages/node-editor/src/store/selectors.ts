/**
 * Memoized selector functions for the editor store.
 */

import type { NodeEditorState } from './editor-store.js';

export const selectNodes = (state: NodeEditorState) => state.nodes;
export const selectEdges = (state: NodeEditorState) => state.edges;
export const selectSelectedElementIds = (state: NodeEditorState) => state.selectedElementIds;
export const selectHoveredElementId = (state: NodeEditorState) => state.hoveredElementId;
export const selectCollapsedNodes = (state: NodeEditorState) => state.collapsedNodes;
export const selectViewport = (state: NodeEditorState) => state.viewport;

export const selectFirstSelectedId = (state: NodeEditorState): string | null =>
  state.selectedElementIds.length > 0 ? state.selectedElementIds[0] : null;

export const selectIsNodeSelected = (nodeId: string) => (state: NodeEditorState): boolean =>
  state.selectedElementIds.includes(nodeId);

export const selectIsNodeCollapsed = (nodeId: string) => (state: NodeEditorState): boolean =>
  state.collapsedNodes[nodeId] ?? false;
