/**
 * Pure list-management helpers for the recent-files feature.
 *
 * Kept free of IndexedDB / Electron so the dedupe + cap behaviour can be unit
 * tested in isolation. The persistence layers (web IndexedDB, Electron IPC)
 * build on top of these.
 */

/** Kind of file tracked in recents. */
export type RecentFileKind = 'xosc' | 'xodr';

/** A single recent-file entry (web side). */
export interface RecentFileEntry {
  /** Display name, e.g. "cut-in.xosc". */
  name: string;
  /** File kind, drives the open routing. */
  kind: RecentFileKind;
  /** Last-opened time (epoch ms); used for ordering and as part of the key. */
  timestamp: number;
  /**
   * File System Access handle, when available (Chromium). Lets re-save reuse
   * the original file. Absent when the browser only exposed file contents.
   */
  handle?: FileSystemFileHandle;
}

/** Maximum number of recent files retained. */
export const MAX_RECENT_FILES = 10;

/** Stable identity for an entry: name + kind (timestamp is the tiebreaker). */
export function recentEntryKey(entry: Pick<RecentFileEntry, 'name' | 'kind'>): string {
  return `${entry.kind}:${entry.name}`;
}

/**
 * Insert `entry` at the front of `list`, removing any prior entry with the same
 * name+kind, and cap the result to `MAX_RECENT_FILES`. Pure — returns a new array.
 */
export function addToRecentList(
  list: readonly RecentFileEntry[],
  entry: RecentFileEntry,
): RecentFileEntry[] {
  const key = recentEntryKey(entry);
  const deduped = list.filter((e) => recentEntryKey(e) !== key);
  return [entry, ...deduped].slice(0, MAX_RECENT_FILES);
}

/** Infer the file kind from a file name's extension. Returns null if unknown. */
export function kindFromFileName(name: string): RecentFileKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.xosc')) return 'xosc';
  if (lower.endsWith('.xodr')) return 'xodr';
  return null;
}
