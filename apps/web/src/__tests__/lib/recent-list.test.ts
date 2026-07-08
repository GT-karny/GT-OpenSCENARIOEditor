import { describe, it, expect } from 'vitest';
import {
  addToRecentList,
  kindFromFileName,
  recentEntryKey,
  MAX_RECENT_FILES,
  type RecentFileEntry,
} from '../../lib/recent-files/recent-list';

function entry(name: string, kind: 'xosc' | 'xodr', timestamp = 1): RecentFileEntry {
  return { name, kind, timestamp };
}

describe('kindFromFileName', () => {
  it('detects .xosc and .xodr (case-insensitive)', () => {
    expect(kindFromFileName('cut-in.xosc')).toBe('xosc');
    expect(kindFromFileName('highway.XODR')).toBe('xodr');
  });

  it('returns null for unsupported extensions', () => {
    expect(kindFromFileName('notes.txt')).toBeNull();
    expect(kindFromFileName('noext')).toBeNull();
  });
});

describe('recentEntryKey', () => {
  it('keys by kind + name', () => {
    expect(recentEntryKey({ name: 'a.xosc', kind: 'xosc' })).toBe('xosc:a.xosc');
  });

  it('distinguishes same name across kinds', () => {
    expect(recentEntryKey({ name: 'x', kind: 'xosc' })).not.toBe(
      recentEntryKey({ name: 'x', kind: 'xodr' }),
    );
  });
});

describe('addToRecentList', () => {
  it('prepends a new entry', () => {
    const result = addToRecentList([entry('a.xosc', 'xosc')], entry('b.xosc', 'xosc'));
    expect(result.map((e) => e.name)).toEqual(['b.xosc', 'a.xosc']);
  });

  it('deduplicates by name+kind, moving the entry to the front', () => {
    const list = [entry('a.xosc', 'xosc'), entry('b.xosc', 'xosc')];
    const result = addToRecentList(list, entry('a.xosc', 'xosc', 99));
    expect(result.map((e) => e.name)).toEqual(['a.xosc', 'b.xosc']);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(99);
  });

  it('treats same name with different kind as distinct entries', () => {
    const result = addToRecentList([entry('road.xodr', 'xodr')], entry('road.xosc', 'xosc'));
    expect(result).toHaveLength(2);
  });

  it('caps the list at MAX_RECENT_FILES, dropping the oldest', () => {
    let list: RecentFileEntry[] = [];
    for (let i = 0; i < MAX_RECENT_FILES + 5; i++) {
      list = addToRecentList(list, entry(`file${i}.xosc`, 'xosc', i));
    }
    expect(list).toHaveLength(MAX_RECENT_FILES);
    // Most recent first; the oldest entries were dropped.
    expect(list[0].name).toBe(`file${MAX_RECENT_FILES + 4}.xosc`);
    expect(list.some((e) => e.name === 'file0.xosc')).toBe(false);
  });

  it('does not mutate the input list', () => {
    const list = [entry('a.xosc', 'xosc')];
    const result = addToRecentList(list, entry('b.xosc', 'xosc'));
    expect(list).toHaveLength(1);
    expect(result).not.toBe(list);
  });
});
