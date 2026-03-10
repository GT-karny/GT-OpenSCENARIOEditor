/**
 * Orchestrator component that renders all traffic signals from an OpenDRIVE document.
 * Flattens road.signals[] across all roads, resolves positions once, and renders entities.
 */

import React, { useMemo } from 'react';
import type { OpenDriveDocument, OdrSignal, OdrRoad, SimulationFrame } from '@osce/shared';
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
  selectedSignalKey?: string | null;
  onSignalSelect?: (key: string) => void;
  currentFrame?: SimulationFrame | null;
}

export const TrafficSignalGroup: React.FC<TrafficSignalGroupProps> = React.memo(
  ({ openDriveDocument, showLabels, selectedSignalKey, onSignalSelect, currentFrame }) => {
    // Build signal ID → state string map from current simulation frame
    const signalStateMap = useMemo(() => {
      const map = new Map<string, string>();
      if (!currentFrame?.trafficLightStates) return map;
      for (const tl of currentFrame.trafficLightStates) {
        map.set(String(tl.signalId), tl.state);
      }
      return map;
    }, [currentFrame?.trafficLightStates]);

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
            isSelected={rs.key === selectedSignalKey}
            onClick={() => onSignalSelect?.(rs.key)}
            activeState={signalStateMap.get(rs.signal.id)}
          />
        ))}
      </group>
    );
  },
);

TrafficSignalGroup.displayName = 'TrafficSignalGroup';
