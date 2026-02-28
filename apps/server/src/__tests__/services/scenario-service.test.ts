import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ScenarioService } from '../../services/scenario-service.js';

// Use sample files from Thirdparty in main repo root
// Worktrees don't include untracked dirs, so we resolve to the main repo
function findRepoRoot(): string {
  // The worktree is at <repo>/.claude/worktrees/server/
  // Go up from __dirname to find the root with Thirdparty
  let dir = path.resolve(__dirname, '../../../../..');
  // If in worktree, go to main repo
  if (dir.includes('.claude')) {
    dir = dir.replace(/[/\\]\.claude[/\\]worktrees[/\\][^/\\]+/, '');
  }
  return dir;
}

const REPO_ROOT = findRepoRoot();
const XOSC_DIR = path.join(
  REPO_ROOT,
  'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xosc',
);
const XODR_DIR = path.join(
  REPO_ROOT,
  'Thirdparty/esmini-demo_Windows/esmini-demo/resources/xodr',
);

describe('ScenarioService', () => {
  const service = new ScenarioService();

  describe('parseXosc', () => {
    it('should parse a valid .xosc file', () => {
      const xml = readFileSync(path.join(XOSC_DIR, 'cut-in.xosc'), 'utf-8');
      const doc = service.parseXosc(xml);
      expect(doc).toBeDefined();
      expect(doc.fileHeader).toBeDefined();
      expect(doc.entities).toBeDefined();
      expect(doc.storyboard).toBeDefined();
    });

    it('should throw ParseError for invalid XML', () => {
      expect(() => service.parseXosc('not xml at all')).toThrow('Failed to parse XOSC');
    });
  });

  describe('serializeXosc', () => {
    it('should round-trip a .xosc file', () => {
      const xml = readFileSync(path.join(XOSC_DIR, 'cut-in.xosc'), 'utf-8');
      const doc = service.parseXosc(xml);
      const serialized = service.serializeXosc(doc);
      expect(serialized).toContain('<?xml');
      expect(serialized).toContain('OpenSCENARIO');
    });
  });

  describe('parseXodr', () => {
    it('should parse a valid .xodr file', () => {
      const xml = readFileSync(path.join(XODR_DIR, 'straight_500m.xodr'), 'utf-8');
      const doc = service.parseXodr(xml);
      expect(doc).toBeDefined();
      expect(doc.header).toBeDefined();
      expect(doc.roads).toBeDefined();
    });

    it('should throw ParseError for invalid XML', () => {
      expect(() => service.parseXodr('not xml')).toThrow('Failed to parse XODR');
    });
  });

  describe('validate', () => {
    it('should validate a parsed document', () => {
      const xml = readFileSync(path.join(XOSC_DIR, 'cut-in.xosc'), 'utf-8');
      const doc = service.parseXosc(xml);
      const result = service.validate(doc);
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
