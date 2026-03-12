/**
 * Renders all scenario position markers (from actions/conditions).
 * Filters out entries with unresolvable positions (worldCoords === null).
 * Highlights markers whose ownerElementId is in the highlighted set.
 */

import React, { useMemo } from 'react';
import { PositionMarker } from './PositionMarker.js';
import type { ScenarioPositionEntry } from '../scenario/useScenarioPositions.js';

export interface PositionMarkersOverlayProps {
  positions: ScenarioPositionEntry[];
  highlightedElementIds: string[];
}

export const PositionMarkersOverlay: React.FC<PositionMarkersOverlayProps> = React.memo(
  ({ positions, highlightedElementIds }) => {
    const highlightedSet = useMemo(
      () => new Set(highlightedElementIds),
      [highlightedElementIds],
    );

    const resolvablePositions = useMemo(
      () => positions.filter((p) => p.worldCoords != null),
      [positions],
    );

    if (resolvablePositions.length === 0) return null;

    return (
      <>
        {resolvablePositions.map((entry) => (
          <PositionMarker
            key={entry.key}
            position={[entry.worldCoords!.x, entry.worldCoords!.y, entry.worldCoords!.z]}
            heading={entry.worldCoords!.h}
            category={entry.category}
            isHighlighted={highlightedSet.has(entry.ownerElementId)}
          />
        ))}
      </>
    );
  },
);

PositionMarkersOverlay.displayName = 'PositionMarkersOverlay';
