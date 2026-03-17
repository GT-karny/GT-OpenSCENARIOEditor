/**
 * Ghost lane preview for lane addition.
 * Shows a translucent mesh where a new lane would be added.
 * Phase 1: placeholder — will be enhanced with actual lane mesh geometry later.
 */

import { useMemo } from 'react';
import type { OpenDriveDocument } from '@osce/shared';

interface LaneGhostPreviewProps {
  active: boolean;
  openDriveDocument: OpenDriveDocument;
  roadId: string | null;
  sectionIdx: number;
  side: 'left' | 'right';
  position: 'outer' | 'inner';
}

export function LaneGhostPreview({
  active,
  openDriveDocument,
  roadId,
  sectionIdx,
  side,
  position,
}: LaneGhostPreviewProps) {
  const road = useMemo(() => {
    if (!active || !roadId) return null;
    return openDriveDocument.roads.find((r) => r.id === roadId) ?? null;
  }, [active, roadId, openDriveDocument]);

  // Suppress unused variable warnings — reserved for future mesh generation
  void sectionIdx;
  void side;
  void position;

  if (!road) return null;

  // Phase 1: placeholder — generating proper ghost mesh requires the opendrive mesh builder.
  // Will be enhanced to render a translucent lane-shaped mesh at the target position.
  return null;
}
