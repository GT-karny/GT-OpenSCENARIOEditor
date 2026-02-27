import { describe, it, expect } from 'vitest';
import { createHierarchyEdge, createTriggerEdge, resetEdgeCounter } from '../conversion/edge-factory.js';

describe('edge-factory', () => {
  it('should create hierarchy edge', () => {
    resetEdgeCounter();
    const edge = createHierarchyEdge('parent1', 'child1');
    expect(edge.source).toBe('parent1');
    expect(edge.target).toBe('child1');
    expect(edge.type).toBe('hierarchy');
    expect(edge.id).toContain('h-parent1-child1');
  });

  it('should create trigger edge with animation', () => {
    resetEdgeCounter();
    const edge = createTriggerEdge('trigger1', 'target1', 'start');
    expect(edge.source).toBe('trigger1');
    expect(edge.target).toBe('target1');
    expect(edge.type).toBe('trigger');
    expect(edge.animated).toBe(true);
  });

  it('should generate unique edge ids', () => {
    resetEdgeCounter();
    const edge1 = createHierarchyEdge('a', 'b');
    const edge2 = createHierarchyEdge('a', 'b');
    expect(edge1.id).not.toBe(edge2.id);
  });
});
