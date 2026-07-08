/**
 * Track metadata (editor-only, not persisted to .xosc) shared between the
 * Intersection Timeline panel and its Signal Pick Mode hook.
 *
 * Split out to avoid a circular import between IntersectionTimelinePanel.tsx
 * (the panel) and use-signal-pick-mode.ts (the hook), which both need these.
 */

import { SIGNAL_CATALOG } from '@osce/3d-viewer';

export interface TrackMeta {
  trackKey: string;
  label: string;
  catalogKey: string;
  signalIds: string[];
  /** Cached states per phase index (used when signalIds is empty) */
  pendingStates?: Record<number, string>;
}

/** Build a default "all off" state string matching the bulb count for a signal. */
export function defaultOffState(signalId: string, tracks: readonly TrackMeta[]): string {
  const track = tracks.find((t) => t.signalIds.includes(signalId));
  const catalogKey = track?.catalogKey;
  const bulbCount = catalogKey ? (SIGNAL_CATALOG.get(catalogKey)?.bulbs.length ?? 3) : 3;
  return Array(bulbCount).fill('off').join(';');
}
