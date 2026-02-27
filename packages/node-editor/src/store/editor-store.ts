/**
 * Zustand store for local node-editor UI state.
 * Manages selection, collapsed nodes, viewport, and derived nodes/edges.
 */

import { createStore } from 'zustand/vanilla';
import type { Node, Edge } from '@xyflow/react';
import type { OsceNodeData } from '../types/node-types.js';

export interface NodeEditorState {
  // Derived from scenario document
  nodes: Node<OsceNodeData>[];
  edges: Edge[];

  // UI state
  selectedElementIds: string[];
  hoveredElementId: string | null;
  collapsedNodes: Record<string, boolean>;
  viewport: { x: number; y: number; zoom: number };

  // Actions
  setSelectedElementIds: (ids: string[]) => void;
  setHoveredElementId: (id: string | null) => void;
  toggleNodeCollapsed: (nodeId: string) => void;
  setCollapsedNodes: (collapsed: Record<string, boolean>) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setNodes: (nodes: Node<OsceNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export function createEditorStore() {
  return createStore<NodeEditorState>()((set, get) => ({
    nodes: [],
    edges: [],
    selectedElementIds: [],
    hoveredElementId: null,
    collapsedNodes: {},
    viewport: { x: 0, y: 0, zoom: 1 },

    setSelectedElementIds: (ids: string[]) => set({ selectedElementIds: ids }),
    setHoveredElementId: (id: string | null) => set({ hoveredElementId: id }),
    toggleNodeCollapsed: (nodeId: string) => {
      const current = get().collapsedNodes;
      set({
        collapsedNodes: {
          ...current,
          [nodeId]: !current[nodeId],
        },
      });
    },
    setCollapsedNodes: (collapsed: Record<string, boolean>) => set({ collapsedNodes: collapsed }),
    setViewport: (viewport: { x: number; y: number; zoom: number }) => set({ viewport }),
    setNodes: (nodes: Node<OsceNodeData>[]) => set({ nodes }),
    setEdges: (edges: Edge[]) => set({ edges }),
  }));
}

export type EditorStoreApi = ReturnType<typeof createEditorStore>;
