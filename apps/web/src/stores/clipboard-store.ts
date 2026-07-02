/**
 * Lightweight clipboard store for storyboard element copy/paste.
 * Stores deep-cloned snapshots with original IDs — fresh IDs are
 * generated at paste time via deepCloneWithNewIds().
 *
 * Supports multi-select: `copiedItems` holds an order-stable array. The
 * legacy `copiedItem` accessor returns the first item (or null) so existing
 * single-selection callers keep working unchanged.
 */

import { create } from 'zustand';
import type { CloneableElementType } from '@osce/scenario-engine';

export interface ClipboardItem {
  type: CloneableElementType;
  data: unknown;
}

interface ClipboardState {
  copiedItems: ClipboardItem[];
  /** First copied item, or null when the clipboard is empty. */
  copiedItem: ClipboardItem | null;
  /** Copy a single element (replaces clipboard contents). */
  copy: (type: CloneableElementType, data: unknown) => void;
  /** Copy multiple elements at once (order-stable, replaces clipboard). */
  copyMany: (items: ClipboardItem[]) => void;
  clear: () => void;
}

export const useClipboardStore = create<ClipboardState>()((set) => ({
  copiedItems: [],
  copiedItem: null,
  copy: (type, data) => {
    const item: ClipboardItem = { type, data: structuredClone(data) };
    set({ copiedItems: [item], copiedItem: item });
  },
  copyMany: (items) => {
    const cloned = items.map((it) => ({ type: it.type, data: structuredClone(it.data) }));
    set({ copiedItems: cloned, copiedItem: cloned[0] ?? null });
  },
  clear: () => set({ copiedItems: [], copiedItem: null }),
}));
