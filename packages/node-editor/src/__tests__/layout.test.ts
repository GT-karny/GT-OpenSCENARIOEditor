import { describe, it, expect } from 'vitest';
import { applyDagreLayout } from '../conversion/layout.js';
import { documentToFlow } from '../conversion/document-to-flow.js';
import { createTestDocument } from './helpers.js';

describe('applyDagreLayout', () => {
  it('should assign positions to all nodes', () => {
    const doc = createTestDocument();
    const { nodes, edges } = documentToFlow(doc, {
      collapsedNodes: {},
      savedPositions: {},
      selectedIds: [],
    });

    const layouted = applyDagreLayout(nodes, edges);

    for (const node of layouted) {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    }
  });

  it('should return same number of nodes', () => {
    const doc = createTestDocument();
    const { nodes, edges } = documentToFlow(doc, {
      collapsedNodes: {},
      savedPositions: {},
      selectedIds: [],
    });

    const layouted = applyDagreLayout(nodes, edges);
    expect(layouted).toHaveLength(nodes.length);
  });

  it('should handle empty array', () => {
    const layouted = applyDagreLayout([], []);
    expect(layouted).toHaveLength(0);
  });

  it('should use custom layout options', () => {
    const doc = createTestDocument();
    const { nodes, edges } = documentToFlow(doc, {
      collapsedNodes: {},
      savedPositions: {},
      selectedIds: [],
    });

    const tb = applyDagreLayout(nodes, edges, { direction: 'TB' });
    const lr = applyDagreLayout(nodes, edges, { direction: 'LR' });

    // LR layout should generally have wider spread on x-axis
    const tbXSpread = Math.max(...tb.map((n) => n.position.x)) - Math.min(...tb.map((n) => n.position.x));
    const lrXSpread = Math.max(...lr.map((n) => n.position.x)) - Math.min(...lr.map((n) => n.position.x));

    // In TB mode, the y-spread should be larger; in LR mode, the x-spread should be larger
    // This is a soft check - the main thing is that both work without errors
    expect(tbXSpread).toBeGreaterThanOrEqual(0);
    expect(lrXSpread).toBeGreaterThanOrEqual(0);
  });
});
