/**
 * Lightweight clipboard store for storyboard element copy/paste.
 * Stores a deep-cloned snapshot with original IDs — fresh IDs are
 * generated at paste time via deepCloneWithNewIds().
 */

import { create } from 'zustand';
import type { CloneableElementType } from '@osce/scenario-engine';

interface ClipboardItem {
  type: CloneableElementType;
  data: unknown;
}

interface ClipboardState {
  copiedItem: ClipboardItem | null;
  copy: (type: CloneableElementType, data: unknown) => void;
  clear: () => void;
}

export const useClipboardStore = create<ClipboardState>()((set) => ({
  copiedItem: null,
  copy: (type, data) => set({ copiedItem: { type, data: structuredClone(data) } }),
  clear: () => set({ copiedItem: null }),
}));
