import { describe, it, expect } from 'vitest';
import { getLaneColor } from '../../utils/lane-type-colors.js';

describe('getLaneColor', () => {
  it('returns gray for driving lanes', () => {
    expect(getLaneColor('driving')).toBe('#808080');
  });

  it('returns tan for sidewalk', () => {
    expect(getLaneColor('sidewalk')).toBe('#C8B070');
  });

  it('returns blue tint for parking', () => {
    expect(getLaneColor('parking')).toBe('#4060A0');
  });

  it('returns dark gray for shoulder', () => {
    expect(getLaneColor('shoulder')).toBe('#606060');
  });

  it('returns yellow-tinted for stop lanes', () => {
    expect(getLaneColor('stop')).toBe('#A0A000');
  });

  it('returns a default for unknown lane type', () => {
    expect(getLaneColor('unknownType')).toBe('#606060');
  });

  it('returns valid hex colors for all known lane types', () => {
    const knownTypes = [
      'driving', 'shoulder', 'border', 'stop', 'parking',
      'sidewalk', 'curb', 'biking', 'entry', 'exit',
      'onRamp', 'offRamp', 'median', 'restricted', 'none',
      'bus', 'taxi', 'hov', 'connectingRamp', 'bidirectional',
      'roadWorks', 'tram', 'rail',
    ];
    for (const t of knownTypes) {
      const color = getLaneColor(t);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
