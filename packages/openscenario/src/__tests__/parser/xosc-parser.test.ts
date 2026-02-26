import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { REPO_ROOT } from '../test-helpers.js';

const parser = new XoscParser();

function readXosc(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf-8');
}

describe('XoscParser', () => {
  describe('parse CutIn.xosc', () => {
    const xml = readXosc('Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc');
    const doc = parser.parse(xml);

    it('parses FileHeader', () => {
      expect(doc.fileHeader.revMajor).toBe(1);
      expect(doc.fileHeader.revMinor).toBeGreaterThanOrEqual(0);
      expect(doc.fileHeader.author).toBeTruthy();
    });

    it('parses entities', () => {
      expect(doc.entities.length).toBeGreaterThan(0);
      const ego = doc.entities.find((e) => e.name.toLowerCase().includes('ego') || e.name.includes('Ego'));
      if (ego) {
        expect(ego.type).toBe('vehicle');
      }
    });

    it('parses storyboard with stories', () => {
      expect(doc.storyboard).toBeDefined();
      expect(doc.storyboard.stories.length).toBeGreaterThan(0);
    });

    it('parses init actions', () => {
      expect(doc.storyboard.init).toBeDefined();
      expect(doc.storyboard.init.entityActions.length).toBeGreaterThan(0);
    });

    it('has a stop trigger', () => {
      expect(doc.storyboard.stopTrigger).toBeDefined();
    });

    it('generates UUIDs for all elements', () => {
      expect(doc.id).toBeTruthy();
      expect(doc.storyboard.id).toBeTruthy();
      for (const entity of doc.entities) {
        expect(entity.id).toBeTruthy();
      }
    });

    it('creates default _editor metadata', () => {
      expect(doc._editor).toBeDefined();
      expect(doc._editor.formatVersion).toBe('1.0.0');
    });
  });

  describe('parse SimpleOvertake.xosc', () => {
    it('parses without error', () => {
      const xml = readXosc('Thirdparty/openscenario-v1.2.0/Examples/SimpleOvertake.xosc');
      const doc = parser.parse(xml);
      expect(doc.entities.length).toBeGreaterThan(0);
      expect(doc.storyboard.stories.length).toBeGreaterThan(0);
    });
  });

  it('throws on invalid XML', () => {
    expect(() => parser.parse('<NotOpenSCENARIO/>')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => parser.parse('')).toThrow();
  });
});
