/**
 * Orchestrator component that renders all traffic signals from an OpenDRIVE document.
 * Flattens road.signals[] across all roads, resolves positions once, and renders entities.
 */

import React, { useMemo } from 'react';
import type { OpenDriveDocument, OdrSignal, OdrRoad } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import { classifySignal } from '../utils/signal-geometry.js';
import { resolveSignalPosition } from '../utils/signal-position-resolver.js';
import { TrafficSignalEntity } from './TrafficSignalEntity.js';

export interface ResolvedSignal {
  key: string;
  signal: OdrSignal;
  road: OdrRoad;
  position: WorldCoords;
  category: SignalCategory;
}

interface TrafficSignalGroupProps {
  openDriveDocument: OpenDriveDocument | null;
  showLabels: boolean;
}

export const TrafficSignalGroup: React.FC<TrafficSignalGroupProps> = React.memo(
  ({ openDriveDocument, showLabels }) => {
    const resolvedSignals = useMemo(() => {
      if (!openDriveDocument) return [];

      const signals: ResolvedSignal[] = [];
      for (const road of openDriveDocument.roads) {
        for (const signal of road.signals) {
          const position = resolveSignalPosition(signal, road);
          if (!position) continue;
          signals.push({
            key: `${road.id}:${signal.id}`,
            signal,
            road,
            position,
            category: classifySignal(signal),
          });
        }
      }
      return signals;
    }, [openDriveDocument]);

    if (resolvedSignals.length === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {resolvedSignals.map((rs) => (
          <TrafficSignalEntity
            key={rs.key}
            signal={rs.signal}
            position={rs.position}
            category={rs.category}
            showLabel={showLabels}
          />
        ))}
      </group>
    );
  },
);

TrafficSignalGroup.displayName = 'TrafficSignalGroup';
