import { describe, it, expect } from 'vitest';
import {
  computeRelativeFilePath,
  normalizeRelativePath,
} from '../../lib/catalog-location-utils';

describe('normalizeRelativePath', () => {
  it('drops ./ and empty segments and converts backslashes', () => {
    expect(normalizeRelativePath('./xodr/highway.xodr')).toBe('xodr/highway.xodr');
    expect(normalizeRelativePath('xodr//highway.xodr')).toBe('xodr/highway.xodr');
    expect(normalizeRelativePath('..\\xodr\\highway.xodr')).toBe('../xodr/highway.xodr');
  });

  it('collapses .. into its preceding segment', () => {
    expect(normalizeRelativePath('xosc/../xodr/highway.xodr')).toBe('xodr/highway.xodr');
  });

  it('preserves leading .. segments (root escape stays visible)', () => {
    expect(normalizeRelativePath('../xodr/highway.xodr')).toBe('../xodr/highway.xodr');
    expect(normalizeRelativePath('../../xodr/highway.xodr')).toBe('../../xodr/highway.xodr');
    expect(normalizeRelativePath('xosc/../../xodr/x.xodr')).toBe('../xodr/x.xodr');
  });
});

describe('computeRelativeFilePath', () => {
  it('computes relative path from xosc in subfolder to xodr in sibling folder', () => {
    expect(computeRelativeFilePath('xosc/scenario.xosc', 'xodr/highway.xodr')).toBe(
      '../xodr/highway.xodr',
    );
  });

  it('computes relative path from deeply nested xosc', () => {
    expect(computeRelativeFilePath('xosc/sub/scenario.xosc', 'xodr/highway.xodr')).toBe(
      '../../xodr/highway.xodr',
    );
  });

  it('returns target as-is when source is at project root', () => {
    expect(computeRelativeFilePath('scenario.xosc', 'xodr/highway.xodr')).toBe(
      'xodr/highway.xodr',
    );
  });

  it('computes relative path when files share common directory prefix', () => {
    expect(computeRelativeFilePath('data/xosc/test.xosc', 'data/xodr/road.xodr')).toBe(
      '../xodr/road.xodr',
    );
  });

  it('computes relative path when files are in the same directory', () => {
    expect(computeRelativeFilePath('xosc/scenario.xosc', 'xosc/road.xodr')).toBe('road.xodr');
  });

  it('handles target at project root', () => {
    expect(computeRelativeFilePath('xosc/scenario.xosc', 'road.xodr')).toBe('../road.xodr');
  });
});
