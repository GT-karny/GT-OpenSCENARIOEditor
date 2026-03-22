import { describe, it, expect } from 'vitest';
import { classifyTopology } from '../../operations/junction-topology.js';
import { createTestRoad } from '../helpers.js';

const deg = (d: number) => (d * Math.PI) / 180;

function makeRoad(id: string, length: number) {
  return createTestRoad({ id, length });
}

describe('classifyTopology', () => {
  describe('merge detection', () => {
    it('classifies nearly parallel roads (< 15°) as merge', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(10), roadA, roadB);
      expect(result.topology).toBe('merge');
      expect(result.armCount).toBe(0);
    });

    it('classifies nearly anti-parallel roads (> 165°) as merge', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(170), roadA, roadB);
      expect(result.topology).toBe('merge');
    });
  });

  describe('T-junction detection', () => {
    it('detects T-junction when intersection is at road A start', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      // sA = 0.5 → before segment < 1m → after-only
      const result = classifyTopology(0.5, 50, deg(90), roadA, roadB);
      expect(result.topology).toBe('T-junction');
      expect(result.armCount).toBe(3);
      expect(result.arms[0].side).toBe('after-only');
      expect(result.arms[1].side).toBe('both');
    });

    it('detects T-junction when intersection is at road A end', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      // sA = 99.5 → after segment < 1m → before-only
      const result = classifyTopology(99.5, 50, deg(90), roadA, roadB);
      expect(result.topology).toBe('T-junction');
      expect(result.armCount).toBe(3);
      expect(result.arms[0].side).toBe('before-only');
      expect(result.arms[1].side).toBe('both');
    });

    it('detects T-junction when intersection is at road B start', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 0.5, deg(90), roadA, roadB);
      expect(result.topology).toBe('T-junction');
      expect(result.armCount).toBe(3);
      expect(result.arms[0].side).toBe('both');
      expect(result.arms[1].side).toBe('after-only');
    });
  });

  describe('X-junction detection', () => {
    it('classifies perpendicular crossing as X-junction', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(90), roadA, roadB);
      expect(result.topology).toBe('X-junction');
      expect(result.armCount).toBe(4);
      expect(result.arms[0].side).toBe('both');
      expect(result.arms[1].side).toBe('both');
    });

    it('classifies 60° crossing as X-junction (above Y threshold)', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(60), roadA, roadB);
      expect(result.topology).toBe('X-junction');
      expect(result.armCount).toBe(4);
    });
  });

  describe('Y-junction detection', () => {
    it('classifies 30° crossing as Y-junction', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(30), roadA, roadB);
      expect(result.topology).toBe('Y-junction');
      expect(result.armCount).toBe(4);
    });

    it('classifies 40° crossing as Y-junction', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(40), roadA, roadB);
      expect(result.topology).toBe('Y-junction');
    });

    it('classifies supplementary angle (150°) as Y-junction', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      // 150° → normalized to 30° → Y-junction
      const result = classifyTopology(50, 50, deg(150), roadA, roadB);
      expect(result.topology).toBe('Y-junction');
    });
  });

  describe('edge cases', () => {
    it('uses custom minSegLen parameter', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      // With minSegLen=5, sA=3 means before segment < 5 → T-junction
      const result = classifyTopology(3, 50, deg(90), roadA, roadB, 5);
      expect(result.topology).toBe('T-junction');
    });

    it('treats 45° boundary as X-junction (not Y)', () => {
      const roadA = makeRoad('A', 100);
      const roadB = makeRoad('B', 100);
      const result = classifyTopology(50, 50, deg(45), roadA, roadB);
      expect(result.topology).toBe('X-junction');
    });
  });
});
