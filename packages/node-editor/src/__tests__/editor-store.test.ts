import { describe, it, expect } from 'vitest';
import { createEditorStore } from '../store/editor-store.js';

describe('editor-store', () => {
  it('should create store with default state', () => {
    const store = createEditorStore();
    const state = store.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedElementIds).toEqual([]);
    expect(state.hoveredElementId).toBeNull();
    expect(state.collapsedNodes).toEqual({});
    expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('should set selected element ids', () => {
    const store = createEditorStore();
    store.getState().setSelectedElementIds(['id1', 'id2']);
    expect(store.getState().selectedElementIds).toEqual(['id1', 'id2']);
  });

  it('should set hovered element id', () => {
    const store = createEditorStore();
    store.getState().setHoveredElementId('hover1');
    expect(store.getState().hoveredElementId).toBe('hover1');

    store.getState().setHoveredElementId(null);
    expect(store.getState().hoveredElementId).toBeNull();
  });

  it('should toggle node collapsed', () => {
    const store = createEditorStore();

    store.getState().toggleNodeCollapsed('node1');
    expect(store.getState().collapsedNodes['node1']).toBe(true);

    store.getState().toggleNodeCollapsed('node1');
    expect(store.getState().collapsedNodes['node1']).toBe(false);
  });

  it('should set viewport', () => {
    const store = createEditorStore();
    store.getState().setViewport({ x: 100, y: 200, zoom: 1.5 });
    expect(store.getState().viewport).toEqual({ x: 100, y: 200, zoom: 1.5 });
  });

  it('should set nodes', () => {
    const store = createEditorStore();
    const nodes = [{ id: 'n1', position: { x: 0, y: 0 }, data: { osceType: 'storyboard' as const, storyCount: 0, hasStopTrigger: false } }];
    store.getState().setNodes(nodes);
    expect(store.getState().nodes).toEqual(nodes);
  });

  it('should set edges', () => {
    const store = createEditorStore();
    const edges = [{ id: 'e1', source: 'a', target: 'b' }];
    store.getState().setEdges(edges);
    expect(store.getState().edges).toEqual(edges);
  });

  it('should set collapsed nodes batch', () => {
    const store = createEditorStore();
    store.getState().setCollapsedNodes({ a: true, b: false, c: true });
    expect(store.getState().collapsedNodes).toEqual({ a: true, b: false, c: true });
  });
});
