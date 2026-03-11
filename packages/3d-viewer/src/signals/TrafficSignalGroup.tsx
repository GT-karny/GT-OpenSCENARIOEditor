/**
 * Orchestrator component that renders all traffic signals from an OpenDRIVE document.
 *
 * Uses InstancedMesh for poles and traffic light heads to minimize draw calls.
 * Non-traffic-light signals (stop, speed limit, generic) are rendered individually.
 *
 * Click detection uses a single manual raycaster (SignalHoverHandler) that only
 * fires on actual clicks — no per-frame hover raycasting for better performance.
 */

import React, { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { OpenDriveDocument, OdrSignal, OdrRoad, SimulationFrame } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import { DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { classifySignal } from '../utils/signal-geometry.js';
import { resolveSignalPosition } from '../utils/signal-position-resolver.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { InstancedPoles } from './InstancedPoles.js';
import { InstancedTrafficLights } from './InstancedTrafficLights.js';
import { SignalSelectionOverlay } from './SignalSelectionOverlay.js';
import { TrafficSignalEntity } from './TrafficSignalEntity.js';
import { SignalLabel } from './SignalLabel.js';
import { SignalHoverHandler } from './SignalHoverHandler.js';

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
    const signalGroupRef = useRef<THREE.Group>(null);

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

    // Split signals by category
    const { trafficLightSignals, otherSignals } = useMemo(() => {
      const tl: ResolvedSignal[] = [];
      const other: ResolvedSignal[] = [];
      for (const rs of resolvedSignals) {
        if (rs.category === 'trafficLight') {
          tl.push(rs);
        } else {
          other.push(rs);
        }
      }
      return { trafficLightSignals: tl, otherSignals: other };
    }, [resolvedSignals]);

    // Lookup map for selection overlay
    const signalByKey = useMemo(() => {
      const map = new Map<string, ResolvedSignal>();
      for (const rs of resolvedSignals) {
        map.set(rs.key, rs);
      }
      return map;
    }, [resolvedSignals]);

    // Selection overlay (selected signal only — no hover)
    const overlaySignal = selectedSignalKey ? signalByKey.get(selectedSignalKey) : undefined;
    const showOverlay = overlaySignal?.category === 'trafficLight';

    if (resolvedSignals.length === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]} ref={signalGroupRef}>
        {/* Click-only handler (no per-frame hover raycasting) */}
        <SignalHoverHandler
          signalGroupRef={signalGroupRef}
          onSignalSelect={onSignalSelect}
        />

        {/* Instanced poles for ALL signals (1 draw call) */}
        <InstancedPoles signals={resolvedSignals} />

        {/* Instanced traffic light heads (K draw calls, K = number of texture groups) */}
        <InstancedTrafficLights
          signals={trafficLightSignals}
          stateMap={signalStateMap}
          selectedKey={selectedSignalKey}
        />

        {/* Selection overlay with Outlines (at most 1 signal) */}
        {showOverlay && overlaySignal && (
          <SignalSelectionOverlay
            signal={overlaySignal}
            activeState={signalStateMap.get(overlaySignal.signal.id)}
            isSelected
          />
        )}

        {/* Non-traffic-light signals: rendered individually (usually few) */}
        {otherSignals.map((rs) => (
          <TrafficSignalEntity
            key={rs.key}
            signal={rs.signal}
            position={rs.position}
            category={rs.category}
            showLabel={false}
            isSelected={rs.key === selectedSignalKey}
            isHovered={false}
            signalKey={rs.key}
          />
        ))}

        {/* Labels for all signals */}
        {showLabels &&
          resolvedSignals.map((rs) => {
            const signalHeight = rs.signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
            const poleHeight = signalHeight;
            const descriptor =
              rs.category === 'trafficLight' ? resolveSignalDescriptor(rs.signal) : null;
            const headHeight = descriptor ? descriptor.housing.height : 0;
            return (
              <group
                key={`label-${rs.key}`}
                position={[rs.position.x, rs.position.y, rs.position.z - signalHeight]}
                rotation={[rs.position.pitch ?? 0, rs.position.roll ?? 0, rs.position.h]}
              >
                <SignalLabel
                  name={rs.signal.name ?? rs.signal.id}
                  position={[0, 0, poleHeight + headHeight + 0.5]}
                />
              </group>
            );
          })}
      </group>
    );
  },
);

TrafficSignalGroup.displayName = 'TrafficSignalGroup';
