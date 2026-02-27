import { describe, it, expect } from 'vitest';
import { documentToFlow } from '../conversion/document-to-flow.js';
import { createTestDocument, createEmptyDocument } from './helpers.js';
import type { OsceNodeData } from '../types/node-types.js';

const defaultOptions = {
  collapsedNodes: {},
  savedPositions: {},
  selectedIds: [],
};

describe('documentToFlow', () => {
  it('should produce nodes and edges from a test document', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it('should create a storyboard root node', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    const sbNode = result.nodes.find((n) => (n.data as OsceNodeData).osceType === 'storyboard');
    expect(sbNode).toBeDefined();
    expect(sbNode!.id).toBe(doc.storyboard.id);
  });

  it('should create an init node', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    const initNode = result.nodes.find((n) => (n.data as OsceNodeData).osceType === 'init');
    expect(initNode).toBeDefined();
    expect(initNode!.id).toBe(doc.storyboard.init.id);
  });

  it('should create entity nodes', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    const entityNodes = result.nodes.filter((n) => (n.data as OsceNodeData).osceType === 'entity');
    expect(entityNodes).toHaveLength(2);
  });

  it('should create story, act, maneuverGroup, maneuver, event, action nodes', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    const types = result.nodes.map((n) => (n.data as OsceNodeData).osceType);
    expect(types).toContain('story');
    expect(types).toContain('act');
    expect(types).toContain('maneuverGroup');
    expect(types).toContain('maneuver');
    expect(types).toContain('event');
    expect(types).toContain('action');
  });

  it('should create trigger and condition nodes for non-empty triggers', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    const triggerNodes = result.nodes.filter((n) => (n.data as OsceNodeData).osceType === 'trigger');
    expect(triggerNodes.length).toBeGreaterThan(0);

    const conditionNodes = result.nodes.filter((n) => (n.data as OsceNodeData).osceType === 'condition');
    expect(conditionNodes.length).toBeGreaterThan(0);
  });

  it('should create hierarchy edges between parent and child nodes', () => {
    const doc = createTestDocument();
    const result = documentToFlow(doc, defaultOptions);

    // Storyboard -> Init edge
    const sbToInit = result.edges.find(
      (e) => e.source === doc.storyboard.id && e.target === doc.storyboard.init.id,
    );
    expect(sbToInit).toBeDefined();

    // Storyboard -> Story edge
    const story = doc.storyboard.stories[0];
    const sbToStory = result.edges.find(
      (e) => e.source === doc.storyboard.id && e.target === story.id,
    );
    expect(sbToStory).toBeDefined();
  });

  it('should skip children of collapsed nodes', () => {
    const doc = createTestDocument();
    const storyId = doc.storyboard.stories[0].id;

    const collapsed = documentToFlow(doc, {
      ...defaultOptions,
      collapsedNodes: { [storyId]: true },
    });

    const expanded = documentToFlow(doc, defaultOptions);

    expect(collapsed.nodes.length).toBeLessThan(expanded.nodes.length);

    // Story node should still exist
    const storyNode = collapsed.nodes.find((n) => n.id === storyId);
    expect(storyNode).toBeDefined();

    // But act nodes should not
    const actNodes = collapsed.nodes.filter((n) => (n.data as OsceNodeData).osceType === 'act');
    expect(actNodes).toHaveLength(0);
  });

  it('should handle an empty document', () => {
    const doc = createEmptyDocument();
    const result = documentToFlow(doc, defaultOptions);

    // Should still have storyboard + init
    expect(result.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('should use saved positions when available', () => {
    const doc = createTestDocument();
    const storyId = doc.storyboard.stories[0].id;

    const result = documentToFlow(doc, {
      ...defaultOptions,
      savedPositions: { [storyId]: { x: 100, y: 200 } },
    });

    const storyNode = result.nodes.find((n) => n.id === storyId);
    expect(storyNode?.position).toEqual({ x: 100, y: 200 });
  });
});
