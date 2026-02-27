/**
 * Hook to subscribe to scenario-engine store and re-derive nodes/edges.
 */

import { useEffect, useRef } from 'react';
import type { StoreApi } from 'zustand';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { EditorStoreApi } from './editor-store.js';
import { documentToFlow } from '../conversion/document-to-flow.js';
import { applyDagreLayout } from '../conversion/layout.js';

export function useScenarioSync(
  scenarioStore: StoreApi<ScenarioStore>,
  editorStore: EditorStoreApi,
): void {
  const isFirstSync = useRef(true);

  useEffect(() => {
    function syncFromDocument() {
      const doc = scenarioStore.getState().document;
      const editorState = editorStore.getState();

      const result = documentToFlow(doc, {
        collapsedNodes: editorState.collapsedNodes,
        savedPositions: doc._editor?.nodePositions ?? {},
        selectedIds: editorState.selectedElementIds,
      });

      // Apply dagre layout for nodes without saved positions
      const layoutedNodes = applyDagreLayout(result.nodes, result.edges);

      // Restore saved positions (override dagre for manually placed nodes)
      const savedPositions = doc._editor?.nodePositions ?? {};
      const finalNodes = layoutedNodes.map((node) => {
        const saved = savedPositions[node.id];
        if (saved) {
          return { ...node, position: saved };
        }
        return node;
      });

      editorStore.getState().setNodes(finalNodes);
      editorStore.getState().setEdges(result.edges);

      // On first sync, load collapsed state from editor metadata
      if (isFirstSync.current) {
        const nodeCollapsed = doc._editor?.nodeCollapsed ?? {};
        editorStore.getState().setCollapsedNodes(nodeCollapsed);
        isFirstSync.current = false;
      }
    }

    // Initial sync
    syncFromDocument();

    // Subscribe to scenario document changes
    const unsubscribe = scenarioStore.subscribe((state, prevState) => {
      if (state.document !== prevState.document) {
        syncFromDocument();
      }
    });

    return unsubscribe;
  }, [scenarioStore, editorStore]);

  // Re-sync when collapsed nodes change
  useEffect(() => {
    const unsubCollapsed = editorStore.subscribe((state, prevState) => {
      if (state.collapsedNodes !== prevState.collapsedNodes) {
        const doc = scenarioStore.getState().document;
        const result = documentToFlow(doc, {
          collapsedNodes: state.collapsedNodes,
          savedPositions: doc._editor?.nodePositions ?? {},
          selectedIds: state.selectedElementIds,
        });

        const layoutedNodes = applyDagreLayout(result.nodes, result.edges);
        const savedPositions = doc._editor?.nodePositions ?? {};
        const finalNodes = layoutedNodes.map((node) => {
          const saved = savedPositions[node.id];
          if (saved) return { ...node, position: saved };
          return node;
        });

        editorStore.getState().setNodes(finalNodes);
        editorStore.getState().setEdges(result.edges);
      }
    });

    return unsubCollapsed;
  }, [scenarioStore, editorStore]);
}
