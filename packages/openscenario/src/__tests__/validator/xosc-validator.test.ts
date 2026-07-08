import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscValidator } from '../../validator/xosc-validator.js';
import { EXAMPLES_DIR } from '../test-helpers.js';

const parser = new XoscParser();
const validator = new XoscValidator();

describe('XoscValidator', () => {
  it('validates a parsed CutIn.xosc with no errors', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);
    const result = validator.validate(doc);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing entity reference', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);

    // Inject a bad reference
    if (doc.storyboard.stories.length > 0) {
      const firstAct = doc.storyboard.stories[0].acts[0];
      if (firstAct?.maneuverGroups.length > 0) {
        firstAct.maneuverGroups[0].actors.entityRefs = ['NonExistentEntity'];
        const result = validator.validate(doc);
        const ref001 = result.errors.find((e) => e.code === 'REF_001');
        expect(ref001).toBeDefined();
        // The i18n contract: params carry the interpolation values for messageKey.
        expect(ref001?.messageKey).toBe('validation.ref001');
        expect(ref001?.params?.ref).toBe('NonExistentEntity');
        expect(ref001?.params?.location).toContain(firstAct.maneuverGroups[0].name);
      }
    }
  });

  it('emits messageKey/params for structural warnings', () => {
    const xml = readFileSync(resolve(EXAMPLES_DIR, 'CutIn.xosc'), 'utf-8');
    const doc = parser.parse(xml);

    // STRUCT_003: empty a story's acts to force a warning carrying a name param.
    if (doc.storyboard.stories.length > 0) {
      const story = doc.storyboard.stories[0];
      story.acts = [];
      const result = validator.validate(doc);
      const struct003 = result.warnings.find((w) => w.code === 'STRUCT_003');
      expect(struct003).toBeDefined();
      expect(struct003?.messageKey).toBe('validation.struct003');
      expect(struct003?.params?.name).toBe(story.name);
    }
  });
});
