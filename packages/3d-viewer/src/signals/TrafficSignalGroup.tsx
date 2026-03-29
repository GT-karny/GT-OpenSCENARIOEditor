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
import * as THREE from 'three';
import type { OpenDriveDocument, OdrSignal, OdrRoad, SimulationFrame } from '@osce/shared';
import type { WorldCoords } from '../utils/position-resolver.js';
import type { SignalCategory } from '../utils/signal-geometry.js';
import { DEFAULT_SIGNAL_HEIGHT } from '../utils/signal-geometry.js';
import { classifySignal } from '../utils/signal-geometry.js';
import { resolveSignalPosition } from '../utils/signal-position-resolver.js';
import { resolveSignalDescriptor } from '../utils/signal-catalog.js';
import { hasFlashingBulb, suppressFlashing } from '../utils/parse-traffic-light-state.js';
import { useFlashingClock } from '../hooks/useFlashingClock.js';
import { InstancedPoles } from './InstancedPoles.js';
import type { PoleAssemblyInfo } from './InstancedPoles.js';
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

/** Signal pick mode configuration passed from the app layer */
export interface SignalPickModeProps {
  bulbCount: number;
  trackSignalIds: ReadonlySet<string>;
  allTrackSignalMap: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Pick mode category for a signal */
export type PickCategory = 'currentTrack' | 'otherTrack' | 'available' | 'incompatible';

interface TrafficSignalGroupProps {
  openDriveDocument: OpenDriveDocument | null;
  showLabels: boolean;
  selectedSignalKey?: string | null;
  onSignalSelect?: (key: string) => void;
  currentFrame?: SimulationFrame | null;
  /** Signal IDs to highlight (e.g. signals belonging to the selected controller) */
  highlightedSignalIds?: ReadonlySet<string>;
  /** Signal pick mode configuration (null = not in pick mode) */
  signalPickMode?: SignalPickModeProps | null;
  /** Callback when a signal is hovered during pick mode */
  onSignalHover?: (signalId: string | null) => void;
  /** Map from signalId to assembly info for arm pole rendering */
  assemblyMap?: Map<string, PoleAssemblyInfo>;
}

export const TrafficSignalGroup: React.FC<TrafficSignalGroupProps> = React.memo(
  ({ openDriveDocument, showLabels, selectedSignalKey, onSignalSelect, currentFrame, highlightedSignalIds, signalPickMode, onSignalHover, assemblyMap }) => {
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

    // Build signalId → bulbCount map for type checking during pick mode
    const signalBulbCountMap = useMemo(() => {
      const map = new Map<string, number>();
      for (const rs of trafficLightSignals) {
        const desc = resolveSignalDescriptor(rs.signal);
        if (desc) map.set(rs.signal.id, desc.bulbs.length);
      }
      return map;
    }, [trafficLightSignals]);

    // Classify signals for pick mode overlays
    const pickCategoryMap = useMemo(() => {
      if (!signalPickMode) return null;
      const map = new Map<string, PickCategory>();
      const { bulbCount, trackSignalIds, allTrackSignalMap } = signalPickMode;

      // Collect all signal IDs from other tracks
      const otherTrackIds = new Set<string>();
      for (const [, ids] of allTrackSignalMap) {
        for (const id of ids) {
          if (!trackSignalIds.has(id)) otherTrackIds.add(id);
        }
      }

      for (const rs of trafficLightSignals) {
        const sid = rs.signal.id;
        if (trackSignalIds.has(sid)) {
          map.set(sid, 'currentTrack');
        } else if (otherTrackIds.has(sid)) {
          map.set(sid, 'otherTrack');
        } else {
          const bc = signalBulbCountMap.get(sid);
          map.set(sid, bc === bulbCount ? 'available' : 'incompatible');
        }
      }
      return map;
    }, [signalPickMode, trafficLightSignals, signalBulbCountMap]);

    // Selection overlay (selected signal only — no hover)
    const overlaySignal = selectedSignalKey ? signalByKey.get(selectedSignalKey) : undefined;
    const showOverlay = overlaySignal?.category === 'trafficLight';

    // Flashing clock for SelectionOverlay (InstancedTrafficLights has its own)
    const anyFlashing = useMemo(() => {
      for (const [, state] of signalStateMap) {
        if (hasFlashingBulb(state)) return true;
      }
      return false;
    }, [signalStateMap]);
    const flashOn = useFlashingClock(anyFlashing);

    // DEBUG: log which overlay layers are active
    if (process.env.NODE_ENV !== 'production') {
      const hlCount = highlightedSignalIds
        ? trafficLightSignals.filter((rs) => highlightedSignalIds.has(rs.signal.id)).length
        : 0;
      const pickCount = pickCategoryMap
        ? trafficLightSignals.filter((rs) => {
            const c = pickCategoryMap.get(rs.signal.id);
            return c && c !== 'incompatible';
          }).length
        : 0;
      if (hlCount > 0 || pickCount > 0) {
        console.debug(
          '[TrafficSignalGroup] overlays:',
          `highlight=${hlCount}`,
          `pick=${pickCount}`,
          `selectedKey=${selectedSignalKey}`,
          pickCategoryMap
            ? `categories=${JSON.stringify(Object.fromEntries(pickCategoryMap))}`
            : '',
        );
      }
    }

    if (resolvedSignals.length === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]} ref={signalGroupRef}>
        {/* Click handler (+ hover raycasting in pick mode) */}
        <SignalHoverHandler
          signalGroupRef={signalGroupRef}
          onSignalSelect={onSignalSelect}
          pickModeActive={signalPickMode != null}
          onSignalHover={onSignalHover}
          signalBulbCountMap={signalPickMode ? signalBulbCountMap : undefined}
          pickModeBulbCount={signalPickMode?.bulbCount}
        />

        {/* Instanced poles for ALL signals (1 draw call) */}
        <InstancedPoles signals={resolvedSignals} assemblyMap={assemblyMap} />

        {/* Instanced traffic light heads (K draw calls, K = number of texture groups) */}
        <InstancedTrafficLights
          signals={trafficLightSignals}
          stateMap={signalStateMap}
          selectedKey={selectedSignalKey}
          assemblyMap={assemblyMap}
        />

        {/* Selection overlay with Outlines (at most 1 signal) */}
        {showOverlay && overlaySignal && (
          <SignalSelectionOverlay
            signal={overlaySignal}
            activeState={(() => {
              const s = signalStateMap.get(overlaySignal.signal.id);
              return s && !flashOn ? suppressFlashing(s) : s;
            })()}
            isSelected
            assemblyMap={assemblyMap}
          />
        )}

        {/* Highlight overlays — ONLY when NOT in pick mode */}
        {highlightedSignalIds &&
          !pickCategoryMap &&
          trafficLightSignals
            .filter((rs) => highlightedSignalIds.has(rs.signal.id) && rs.key !== selectedSignalKey)
            .map((rs) => (
              <SignalHighlightOverlay key={`hl-${rs.key}`} signal={rs} />
            ))}

        {/* Pick mode category overlays (currentTrack only) */}
        {pickCategoryMap &&
          trafficLightSignals
            .filter((rs) => pickCategoryMap.get(rs.signal.id) === 'currentTrack')
            .map((rs) => (
              <SignalPickCategoryOverlay
                key={`pick-${rs.key}`}
                signal={rs}
                category="currentTrack"
              />
            ))}

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
            const pickCat = pickCategoryMap?.get(rs.signal.id);
            const isHighlighted = (highlightedSignalIds?.has(rs.signal.id) ?? false)
              || pickCat === 'currentTrack';
            return (
              <group
                key={`label-${rs.key}`}
                position={[rs.position.x, rs.position.y, rs.position.z - signalHeight]}
                rotation={[rs.position.pitch ?? 0, rs.position.roll ?? 0, rs.position.h]}
              >
                <SignalLabel
                  name={rs.signal.id}
                  position={[0, 0, poleHeight + headHeight + 0.5]}
                  highlighted={isHighlighted}
                />
              </group>
            );
          })}
      </group>
    );
  },
);

TrafficSignalGroup.displayName = 'TrafficSignalGroup';

// ---------------------------------------------------------------------------
// Highlight glow overlay — wraps the housing in emissive color
// ---------------------------------------------------------------------------

import { getSharedBox } from '../utils/shared-geometries.js';
import { GLOW_COLORS, GLOW_OPACITY } from '../constants/selection-theme.js';

const GLOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...GLOW_COLORS.highlight),
  transparent: true,
  opacity: GLOW_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const SignalHighlightOverlay: React.FC<{ signal: ResolvedSignal }> = React.memo(
  ({ signal: rs }) => {
    const { signal, position } = rs;
    const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
    const poleHeight = signalHeight;
    const descriptor = resolveSignalDescriptor(signal);
    if (!descriptor) return null;

    const { housing } = descriptor;
    const headHeight = housing.height;
    const isHorizontal = descriptor.orientation === 'horizontal';
    const rotation: [number, number, number] = isHorizontal
      ? [0, Math.PI / 2, -Math.PI / 2]
      : [0, Math.PI / 2, 0];

    // Slightly larger than actual housing for glow effect
    const pad = 0.06;
    const boxGeo = isHorizontal
      ? getSharedBox(housing.width + pad, housing.height + pad, housing.depth + pad)
      : getSharedBox(housing.height + pad, housing.width + pad, housing.depth + pad);

    return (
      <group
        position={[position.x, position.y, position.z - signalHeight]}
        rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
      >
        {/* Glow box covering the housing */}
        <mesh
          position={[0, 0, poleHeight + headHeight / 2]}
          rotation={rotation}
          geometry={boxGeo}
          material={GLOW_MATERIAL}
        />
      </group>
    );
  },
);

SignalHighlightOverlay.displayName = 'SignalHighlightOverlay';

// ---------------------------------------------------------------------------
// Pick mode category overlay — colored glow per category
// ---------------------------------------------------------------------------

const PICK_GLOW_CURRENT_TRACK = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...GLOW_COLORS.pickCurrent),
  transparent: true,
  opacity: GLOW_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const PICK_GLOW_OTHER_TRACK = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...GLOW_COLORS.pickOther),
  transparent: true,
  opacity: GLOW_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const PICK_GLOW_AVAILABLE = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...GLOW_COLORS.pickAvailable),
  transparent: true,
  opacity: GLOW_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const PICK_CATEGORY_MATERIALS: Record<Exclude<PickCategory, 'incompatible'>, THREE.MeshBasicMaterial> = {
  currentTrack: PICK_GLOW_CURRENT_TRACK,
  otherTrack: PICK_GLOW_OTHER_TRACK,
  available: PICK_GLOW_AVAILABLE,
};

const SignalPickCategoryOverlay: React.FC<{
  signal: ResolvedSignal;
  category: Exclude<PickCategory, 'incompatible'>;
}> = React.memo(({ signal: rs, category }) => {
  const { signal, position } = rs;
  const signalHeight = signal.zOffset ?? DEFAULT_SIGNAL_HEIGHT;
  const poleHeight = signalHeight;
  const descriptor = resolveSignalDescriptor(signal);
  if (!descriptor) return null;

  const { housing } = descriptor;
  const headHeight = housing.height;
  const isHorizontal = descriptor.orientation === 'horizontal';
  const rotation: [number, number, number] = isHorizontal
    ? [0, Math.PI / 2, Math.PI / 2]
    : [0, Math.PI / 2, 0];

  const pad = 0.06;
  const boxGeo = isHorizontal
    ? getSharedBox(housing.width + pad, housing.height + pad, housing.depth + pad)
    : getSharedBox(housing.height + pad, housing.width + pad, housing.depth + pad);
  const material = PICK_CATEGORY_MATERIALS[category];

  return (
    <group
      position={[position.x, position.y, position.z - signalHeight]}
      rotation={[position.pitch ?? 0, position.roll ?? 0, position.h]}
    >
      <mesh
        position={[0, 0, poleHeight + headHeight / 2]}
        rotation={rotation}
        geometry={boxGeo}
        material={material}
      />
    </group>
  );
});

SignalPickCategoryOverlay.displayName = 'SignalPickCategoryOverlay';
