import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { XoscParser } from '../../parser/xosc-parser.js';
import { XoscValidator } from '../../validator/xosc-validator.js';
import { REPO_ROOT } from '../test-helpers.js';

const parser = new XoscParser();
const validator = new XoscValidator();

describe('XoscValidator', () => {
  it('validates a parsed CutIn.xosc with no errors', () => {
    const xml = readFileSync(
      resolve(REPO_ROOT, 'Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc'),
      'utf-8',
    );
    const doc = parser.parse(xml);
    const result = validator.validate(doc);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing entity reference', () => {
    const xml = readFileSync(
      resolve(REPO_ROOT, 'Thirdparty/openscenario-v1.2.0/Examples/CutIn.xosc'),
      'utf-8',
    );
    const doc = parser.parse(xml);

    // Inject a bad reference
    if (doc.storyboard.stories.length > 0) {
      const firstAct = doc.storyboard.stories[0].acts[0];
      if (firstAct?.maneuverGroups.length > 0) {
        firstAct.maneuverGroups[0].actors.entityRefs = ['NonExistentEntity'];
        const result = validator.validate(doc);
        expect(result.errors.some((e) => e.code === 'REF_001')).toBe(true);
      }
    }
  });
});
