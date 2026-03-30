/**
 * Main container for the Intersection Timeline panel.
 *
 * Track-based matrix UI: one controller at a time.
 * Tracks are defined by signal TYPE (not ID) and can have multiple IDs.
 * Columns = phases (shared across all tracks).
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2 } from 'lucide-react';
import type { TrafficSignalController } from '@osce/shared';
import { SIGNAL_CATALOG, defaultOffState as offStateForCount } from '@osce/3d-viewer';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { useScenarioStore, useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { useEditorStore } from '../../../stores/editor-store';
import type { SignalPickMode } from '../../../stores/editor-store';
import { TimelineToolbar } from './TimelineToolbar';
import { SignalTrack } from './SignalTrack';
import type { TrackDefinition } from './SignalTrack';
import { CellEditor } from './CellEditor';
import { TimelinePlayhead } from './TimelinePlayhead';
import {
  useSignalTimeline,
  getControllerCycleDuration,
  getActivePhase,
} from '../../../hooks/use-signal-timeline';
import type { PlaybackSpeed } from '../../../hooks/use-signal-timeline';

// ---------------------------------------------------------------------------
// Signal type presets for the "Add Track" menu
// ---------------------------------------------------------------------------

interface SignalTypePreset {
  key: string;
  label: string;
  descriptor: SignalDescriptor;
  defaultState: string;
}

const SIGNAL_TYPE_PRESETS: SignalTypePreset[] = [
  { key: '1000001', label: '3-color', descriptor: SIGNAL_CATALOG.get('1000001')!, defaultState: offStateForCount(3) },
  { key: '1000002', label: '2-color', descriptor: SIGNAL_CATALOG.get('1000002')!, defaultState: offStateForCount(2) },
  { key: '1000012', label: '1-light', descriptor: SIGNAL_CATALOG.get('1000012')!, defaultState: offStateForCount(1) },
];

const DEFAULT_DESCRIPTOR: SignalDescriptor = SIGNAL_CATALOG.get('1000001')!;

// ---------------------------------------------------------------------------
// Track state management (editor-only metadata, not persisted to .xosc)
// ---------------------------------------------------------------------------

interface TrackMeta {
  trackKey: string;
  label: string;
  catalogKey: string;
  signalIds: string[];
  /** Cached states per phase index (used when signalIds is empty) */
  pendingStates?: Record<number, string>;
}

/** Build a default "all off" state string matching the bulb count for a signal. */
function defaultOffState(signalId: string, tracks: readonly TrackMeta[]): string {
  const track = tracks.find((t) => t.signalIds.includes(signalId));
  const catalogKey = track?.catalogKey;
  const bulbCount = catalogKey ? (SIGNAL_CATALOG.get(catalogKey)?.bulbs.length ?? 3) : 3;
  return Array(bulbCount).fill('off').join(';');
}

let trackCounter = 0;

export function IntersectionTimelinePanel() {
  const storeApi = useScenarioStoreApi();
  const controllers = useScenarioStore(
    useShallow((s) => (s.document.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[]),
  );

  // Selected controller (shared with Properties panel via editor store)
  const selectedControllerId = useEditorStore((s) => s.selectedControllerId);
  const setSelectedControllerId = useEditorStore((s) => s.setSelectedControllerId);
  const selectedController = useMemo(
    () => controllers.find((c) => c.id === selectedControllerId) ?? controllers[0] ?? null,
    [controllers, selectedControllerId],
  );

  // Sync: auto-select first controller when none is selected
  useEffect(() => {
    if (!selectedControllerId && controllers.length > 0) {
      setSelectedControllerId(controllers[0].id);
    }
  }, [selectedControllerId, controllers, setSelectedControllerId]);

  const cycleDuration = selectedController
    ? getControllerCycleDuration(selectedController)
    : 0;

  const {
    currentTime,
    isPlaying,
    playbackSpeed,
    setCurrentTime,
    togglePlay,
    setPlaybackSpeed,
    reset,
  } = useSignalTimeline(cycleDuration);

  // Track metadata (editor-local, keyed by controller ID)
  const [trackMetaMap, setTrackMetaMap] = useState<Record<string, TrackMeta[]>>({});

  // Auto-generate tracks for a controller that has phase data but no track metadata yet.
  // This runs as an effect (not inside useMemo) to avoid setState-during-render.
  //
  // Two key behaviors:
  //   1. Infer signal type (catalogKey) from the bulb count in the state string
  //      (e.g. "on;off;off" → 3 bulbs → '1000001', "on;off" → 2 → '1000002')
  //   2. Group signal IDs that share the same inferred type AND identical states
  //      across all phases into a single track.
  const autoGenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedController) return;
    const cid = selectedController.id;
    // Skip if already generated or if trackMetaMap already has entries
    if (autoGenRef.current.has(cid)) return;
    setTrackMetaMap((prev) => {
      if (prev[cid] && prev[cid].length > 0) return prev;

      // Collect all unique signal IDs
      const allIds = new Set<string>();
      for (const phase of selectedController.phases) {
        for (const st of phase.trafficSignalStates) {
          allIds.add(st.trafficSignalId);
        }
      }
      if (allIds.size === 0) return prev;

      // For each signal ID, build a fingerprint: "catalogKey|state0|state1|..."
      // This groups signals with same type AND same cell values across all phases.
      const fingerprintMap = new Map<string, { catalogKey: string; label: string; ids: string[] }>();

      for (const signalId of allIds) {
        // Collect state strings for this signal across all phases
        const statePerPhase: string[] = [];
        let bulbCount = 3; // default
        for (const phase of selectedController.phases) {
          const st = phase.trafficSignalStates.find((s) => s.trafficSignalId === signalId);
          const stateStr = st?.state ?? '';
          statePerPhase.push(stateStr);
          // Infer bulb count from the first non-empty state
          if (stateStr && bulbCount === 3) {
            const parts = stateStr.split(';');
            if (parts.length > 1) {
              bulbCount = parts.length;
            } else if (stateStr !== 'off') {
              // Single value like "red", "green", "flashing" → 1-bulb signal
              bulbCount = 1;
            }
          }
        }

        // Infer catalogKey from bulb count
        let catalogKey: string;
        let typeLabel: string;
        if (bulbCount >= 3) {
          catalogKey = '1000001';
          typeLabel = '3-color';
        } else if (bulbCount === 2) {
          catalogKey = '1000002';
          typeLabel = '2-color';
        } else {
          catalogKey = '1000012';
          typeLabel = '1-light';
        }

        const fingerprint = `${catalogKey}|${statePerPhase.join('|')}`;

        const existing = fingerprintMap.get(fingerprint);
        if (existing) {
          // Same type and same states → merge into one track
          existing.ids.push(signalId);
        } else {
          fingerprintMap.set(fingerprint, {
            catalogKey,
            label: typeLabel,
            ids: [signalId],
          });
        }
      }

      // Convert grouped entries to TrackMeta
      const generated: TrackMeta[] = [];
      let labelCounter = 0;
      for (const group of fingerprintMap.values()) {
        labelCounter++;
        const key = `track_${++trackCounter}`;
        generated.push({
          trackKey: key,
          label: `${group.label} #${labelCounter}`,
          catalogKey: group.catalogKey,
          signalIds: group.ids,
        });
      }

      if (generated.length === 0) return prev;
      autoGenRef.current.add(cid);
      return { ...prev, [cid]: generated };
    });
  }, [selectedController]);

  // Build TrackDefinition[] from trackMetaMap
  const tracks: TrackDefinition[] = useMemo(() => {
    if (!selectedController) return [];
    const metas = trackMetaMap[selectedController.id];
    if (!metas || metas.length === 0) return [];
    return metas.map((meta) => ({
      trackKey: meta.trackKey,
      label: meta.label,
      catalogKey: meta.catalogKey,
      descriptor: SIGNAL_CATALOG.get(meta.catalogKey) ?? DEFAULT_DESCRIPTOR,
      signalIds: meta.signalIds,
      pendingStates: meta.pendingStates,
    }));
  }, [selectedController, trackMetaMap]);

  // Selected track (for 3D viewer highlighting)
  const [selectedTrackKey, setSelectedTrackKey] = useState<string | null>(null);
  const setHighlightedSignalIds = useEditorStore((s) => s.setHighlightedSignalIds);

  const handleTrackSelect = useCallback(
    (trackKey: string) => {
      setSelectedTrackKey((prev) => (prev === trackKey ? null : trackKey));
    },
    [],
  );

  // Collect all signal IDs across all tracks for controller-level highlighting
  const allControllerSignalIds = useMemo(() => {
    if (!selectedController) return null;
    const metas = trackMetaMap[selectedController.id];
    if (!metas || metas.length === 0) return null;
    const ids = new Set<string>();
    for (const meta of metas) {
      for (const id of meta.signalIds) ids.add(id);
    }
    return ids.size > 0 ? ids : null;
  }, [selectedController, trackMetaMap]);

  // Sync highlighted signal IDs to editor store:
  // - Pick mode active → skip (pick mode uses its own overlay)
  // - Track selected → that track's signal IDs
  // - No track selected → all controller signal IDs (fallback)
  const signalPickModeActive = useEditorStore((s) => s.signalPickMode) != null;
  useEffect(() => {
    if (signalPickModeActive) return; // pick mode manages its own overlays
    if (selectedTrackKey) {
      const track = tracks.find((t) => t.trackKey === selectedTrackKey);
      if (track && track.signalIds.length > 0) {
        setHighlightedSignalIds(new Set(track.signalIds));
      } else {
        setHighlightedSignalIds(allControllerSignalIds);
      }
    } else {
      setHighlightedSignalIds(allControllerSignalIds);
    }
  }, [signalPickModeActive, selectedTrackKey, tracks, allControllerSignalIds, setHighlightedSignalIds]);

  // Clear track selection when controller changes
  useEffect(() => {
    setSelectedTrackKey(null);
  }, [selectedControllerId]);

  // Selected cell for editing
  const [selectedCell, setSelectedCell] = useState<{
    phaseIndex: number;
    trackKey: string;
  } | null>(null);

  // Active phase index
  const activePhaseIndex = useMemo(() => {
    if (!selectedController) return null;
    return getActivePhase(selectedController, currentTime)?.index ?? null;
  }, [selectedController, currentTime]);

  // --- Helpers ---

  const updateTrackMeta = useCallback(
    (controllerId: string, updater: (tracks: TrackMeta[]) => TrackMeta[]) => {
      setTrackMetaMap((prev) => ({
        ...prev,
        [controllerId]: updater(prev[controllerId] ?? []),
      }));
    },
    [],
  );

  const updateControllerPhases = useCallback(
    (updater: (ctrl: TrafficSignalController) => TrafficSignalController) => {
      if (!selectedController) return;
      const doc = storeApi.getState().document;
      const signals = doc.roadNetwork?.trafficSignals;
      if (!signals) return;
      const newSignals = signals.map((c) =>
        c.id === selectedController.id ? updater(c) : c,
      );
      storeApi.getState().updateRoadNetwork({ trafficSignals: newSignals });
    },
    [storeApi, selectedController],
  );

  // --- Handlers ---

  const handleClose = useCallback(() => {
    useEditorStore.getState().toggleIntersectionTimeline();
  }, []);

  const handleCellClick = useCallback(
    (phaseIndex: number, trackKey: string) => {
      setSelectedCell((prev) =>
        prev?.phaseIndex === phaseIndex && prev?.trackKey === trackKey
          ? null
          : { phaseIndex, trackKey },
      );
    },
    [],
  );

  // Change state for a cell (applies to all signal IDs in the track)
  const handleCellStateChange = useCallback(
    (state: string) => {
      if (!selectedCell || !selectedController) return;
      const track = tracks.find((t) => t.trackKey === selectedCell.trackKey);
      if (!track) return;

      if (track.signalIds.length > 0) {
        // Write to scenario store
        updateControllerPhases((ctrl) => ({
          ...ctrl,
          phases: ctrl.phases.map((phase, pi) => {
            if (pi !== selectedCell.phaseIndex) return phase;
            const newStates = [...phase.trafficSignalStates];
            for (const signalId of track.signalIds) {
              const idx = newStates.findIndex((s) => s.trafficSignalId === signalId);
              if (idx >= 0) {
                newStates[idx] = { ...newStates[idx], state };
              } else {
                newStates.push({ trafficSignalId: signalId, state });
              }
            }
            return { ...phase, trafficSignalStates: newStates };
          }),
        }));
      }

      // Always cache in pendingStates (for display when no IDs assigned)
      updateTrackMeta(selectedController.id, (prev) =>
        prev.map((t) =>
          t.trackKey === track.trackKey
            ? {
                ...t,
                pendingStates: {
                  ...(t.pendingStates ?? {}),
                  [selectedCell.phaseIndex]: state,
                },
              }
            : t,
        ),
      );
    },
    [selectedCell, selectedController, tracks, updateControllerPhases, updateTrackMeta],
  );

  // Add track with signal type
  const handleAddTrack = useCallback(
    (preset: SignalTypePreset) => {
      if (!selectedController) return;
      const key = `track_${++trackCounter}`;
      const newMeta: TrackMeta = {
        trackKey: key,
        label: preset.label,
        catalogKey: preset.key,
        signalIds: [],
      };
      updateTrackMeta(selectedController.id, (prev) => [...prev, newMeta]);
    },
    [selectedController, updateTrackMeta],
  );

  // Add a new phase
  const handleAddPhase = useCallback(() => {
    if (!selectedController) return;
    const phaseNum = selectedController.phases.length + 1;
    // Pre-populate with all track signal IDs
    const allIds = tracks.flatMap((t) => t.signalIds);
    const newStates = allIds.map((id) => ({
      trafficSignalId: id,
      state: defaultOffState(id, tracks),
    }));
    updateControllerPhases((ctrl) => ({
      ...ctrl,
      phases: [
        ...ctrl.phases,
        { name: `Phase_${phaseNum}`, duration: 10, trafficSignalStates: newStates },
      ],
    }));
  }, [selectedController, tracks, updateControllerPhases]);

  // Update phase duration
  const handlePhaseDurationChange = useCallback(
    (phaseIndex: number, duration: number) => {
      updateControllerPhases((ctrl) => ({
        ...ctrl,
        phases: ctrl.phases.map((p, i) =>
          i === phaseIndex ? { ...p, duration } : p,
        ),
      }));
    },
    [updateControllerPhases],
  );

  // Update phase name
  const handlePhaseNameChange = useCallback(
    (phaseIndex: number, name: string) => {
      updateControllerPhases((ctrl) => ({
        ...ctrl,
        phases: ctrl.phases.map((p, i) =>
          i === phaseIndex ? { ...p, name } : p,
        ),
      }));
    },
    [updateControllerPhases],
  );

  // Delete phase
  const handleDeletePhase = useCallback(
    (phaseIndex: number) => {
      updateControllerPhases((ctrl) => ({
        ...ctrl,
        phases: ctrl.phases.filter((_, i) => i !== phaseIndex),
      }));
      setSelectedCell(null);
    },
    [updateControllerPhases],
  );

  // Track label change
  const handleTrackLabelChange = useCallback(
    (trackKey: string, label: string) => {
      if (!selectedController) return;
      updateTrackMeta(selectedController.id, (prev) =>
        prev.map((t) => (t.trackKey === trackKey ? { ...t, label } : t)),
      );
    },
    [selectedController, updateTrackMeta],
  );

  // Add signal ID to track (applies pending states if any)
  const handleAddSignalId = useCallback(
    (trackKey: string, signalId: string) => {
      if (!selectedController) return;

      // Extract pending states from the latest trackMetaMap via functional updater,
      // then update signalIds in the same pass to avoid stale closure.
      let pending: Record<number, string> = {};
      setTrackMetaMap((prev) => {
        const metas = prev[selectedController.id] ?? [];
        const meta = metas.find((t) => t.trackKey === trackKey);
        pending = meta?.pendingStates ?? {};
        return {
          ...prev,
          [selectedController.id]: metas.map((t) =>
            t.trackKey === trackKey && !t.signalIds.includes(signalId)
              ? { ...t, signalIds: [...t.signalIds, signalId] }
              : t,
          ),
        };
      });

      // Add TrafficSignalState entries for this ID in all phases, using pending states
      updateControllerPhases((ctrl) => ({
        ...ctrl,
        phases: ctrl.phases.map((phase, pi) => {
          if (phase.trafficSignalStates.some((s) => s.trafficSignalId === signalId)) return phase;
          return {
            ...phase,
            trafficSignalStates: [
              ...phase.trafficSignalStates,
              { trafficSignalId: signalId, state: pending[pi] ?? defaultOffState(signalId, tracks) },
            ],
          };
        }),
      }));
    },
    [selectedController, tracks, updateControllerPhases],
  );

  // Remove signal ID from track
  const handleRemoveSignalId = useCallback(
    (trackKey: string, signalId: string) => {
      if (!selectedController) return;
      updateTrackMeta(selectedController.id, (prev) =>
        prev.map((t) =>
          t.trackKey === trackKey
            ? { ...t, signalIds: t.signalIds.filter((id) => id !== signalId) }
            : t,
        ),
      );
    },
    [selectedController, updateTrackMeta],
  );

  // Delete track
  const handleDeleteTrack = useCallback(
    (trackKey: string) => {
      if (!selectedController) return;
      const meta = trackMetaMap[selectedController.id]?.find((t) => t.trackKey === trackKey);
      updateTrackMeta(selectedController.id, (prev) =>
        prev.filter((t) => t.trackKey !== trackKey),
      );
      if (meta && meta.signalIds.length > 0) {
        updateControllerPhases((ctrl) => ({
          ...ctrl,
          phases: ctrl.phases.map((phase) => ({
            ...phase,
            trafficSignalStates: phase.trafficSignalStates.filter(
              (s) => !meta.signalIds.includes(s.trafficSignalId),
            ),
          })),
        }));
      }
      setSelectedCell((prev) => (prev?.trackKey === trackKey ? null : prev));
    },
    [selectedController, trackMetaMap, updateTrackMeta, updateControllerPhases],
  );

  // --- Signal Pick Mode ---

  const signalPickMode = useEditorStore((s) => s.signalPickMode);
  const pendingSignalPick = useEditorStore((s) => s.pendingSignalPick);

  const handleEnterPickMode = useCallback(
    (trackKey: string) => {
      if (!selectedController) return;
      const metas = trackMetaMap[selectedController.id] ?? [];
      const targetMeta = metas.find((t) => t.trackKey === trackKey);
      if (!targetMeta) return;

      const descriptor = SIGNAL_CATALOG.get(targetMeta.catalogKey);
      const bulbCount = descriptor?.bulbs.length ?? 3;

      // Build allTrackSignalMap
      const allTrackSignalMap = new Map<string, ReadonlySet<string>>();
      for (const meta of metas) {
        if (meta.signalIds.length > 0) {
          allTrackSignalMap.set(meta.trackKey, new Set(meta.signalIds));
        }
      }

      const mode: SignalPickMode = {
        trackKey,
        controllerId: selectedController.id,
        catalogKey: targetMeta.catalogKey,
        bulbCount,
        trackSignalIds: new Set(targetMeta.signalIds),
        allTrackSignalMap,
      };
      useEditorStore.getState().enterSignalPickMode(mode);
    },
    [selectedController, trackMetaMap],
  );

  const handleExitPickMode = useCallback(() => {
    useEditorStore.getState().exitSignalPickMode();
  }, []);

  // Process pending signal pick from 3D viewer.
  // Instead of a two-phase ref+effect approach, we compute the new trackMetaMap inline
  // and re-enter pick mode synchronously to avoid double-firing re-enter effects.
  useEffect(() => {
    if (!pendingSignalPick || !signalPickMode || !selectedController) return;

    const signalId = pendingSignalPick.includes(':')
      ? pendingSignalPick.split(':')[1]
      : pendingSignalPick;

    // Clear pending immediately
    useEditorStore.getState().clearPendingSignalPick();

    const targetTrackKey = signalPickMode.trackKey;
    const controllerId = selectedController.id;
    const prevMetas = trackMetaMap[controllerId] ?? [];

    // --- Compute new metas inline (mirror the add/remove logic) ---
    let newMetas: TrackMeta[];
    if (signalPickMode.trackSignalIds.has(signalId)) {
      // Remove from target track
      console.debug('[pick] remove signal', signalId, 'from track', targetTrackKey);
      newMetas = prevMetas.map((t) =>
        t.trackKey === targetTrackKey
          ? { ...t, signalIds: t.signalIds.filter((id) => id !== signalId) }
          : t,
      );
    } else {
      // Move from another track (if any) then add to target track
      let movedFrom: string | null = null;
      for (const [otherTrackKey, otherIds] of signalPickMode.allTrackSignalMap) {
        if (otherTrackKey !== targetTrackKey && otherIds.has(signalId)) {
          movedFrom = otherTrackKey;
          break;
        }
      }
      console.debug('[pick] add signal', signalId, 'to track', targetTrackKey, movedFrom ? `(moved from ${movedFrom})` : '');
      newMetas = prevMetas.map((t) => {
        if (t.trackKey === movedFrom) {
          return { ...t, signalIds: t.signalIds.filter((id) => id !== signalId) };
        }
        if (t.trackKey === targetTrackKey && !t.signalIds.includes(signalId)) {
          return { ...t, signalIds: [...t.signalIds, signalId] };
        }
        return t;
      });
    }

    // --- Apply trackMetaMap update ---
    setTrackMetaMap((prev) => ({ ...prev, [controllerId]: newMetas }));

    // --- Apply phase updates for the add path ---
    if (!signalPickMode.trackSignalIds.has(signalId)) {
      // Find pending states from the target track meta
      const targetMeta = prevMetas.find((t) => t.trackKey === targetTrackKey);
      const pending = targetMeta?.pendingStates ?? {};
      updateControllerPhases((ctrl) => ({
        ...ctrl,
        phases: ctrl.phases.map((phase, pi) => {
          if (phase.trafficSignalStates.some((s) => s.trafficSignalId === signalId)) return phase;
          return {
            ...phase,
            trafficSignalStates: [
              ...phase.trafficSignalStates,
              { trafficSignalId: signalId, state: pending[pi] ?? defaultOffState(signalId, newMetas) },
            ],
          };
        }),
      }));
    }

    // --- Re-enter pick mode synchronously with the new metas ---
    const targetMeta = newMetas.find((t) => t.trackKey === targetTrackKey);
    if (!targetMeta) return;

    const descriptor = SIGNAL_CATALOG.get(targetMeta.catalogKey);
    const bulbCount = descriptor?.bulbs.length ?? 3;

    const allTrackSignalMap = new Map<string, ReadonlySet<string>>();
    for (const meta of newMetas) {
      if (meta.signalIds.length > 0) {
        allTrackSignalMap.set(meta.trackKey, new Set(meta.signalIds));
      }
    }

    const mode: SignalPickMode = {
      trackKey: targetTrackKey,
      controllerId,
      catalogKey: targetMeta.catalogKey,
      bulbCount,
      trackSignalIds: new Set(targetMeta.signalIds),
      allTrackSignalMap,
    };
    console.debug('[pick] re-enter pick mode for track', targetTrackKey, 'signals:', [...mode.trackSignalIds]);
    useEditorStore.getState().enterSignalPickMode(mode);
  }, [pendingSignalPick, signalPickMode, selectedController, trackMetaMap, updateControllerPhases]);

  // Escape key to exit pick mode
  useEffect(() => {
    if (!signalPickMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitPickMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [signalPickMode, handleExitPickMode]);

  // --- Cell editor info ---

  const cellEditorInfo = useMemo(() => {
    if (!selectedCell || !selectedController) return null;
    const track = tracks.find((t) => t.trackKey === selectedCell.trackKey);
    if (!track) return null;
    const phase = selectedController.phases[selectedCell.phaseIndex];
    if (!phase) return null;
    // Get state from first signal ID, or from pendingStates cache
    let currentState = '';
    for (const id of track.signalIds) {
      const st = phase.trafficSignalStates.find((s) => s.trafficSignalId === id);
      if (st) { currentState = st.state; break; }
    }
    if (!currentState) {
      const meta = trackMetaMap[selectedController.id]?.find(
        (t) => t.trackKey === selectedCell.trackKey,
      );
      currentState = meta?.pendingStates?.[selectedCell.phaseIndex] ?? '';
    }
    return { track, phaseName: phase.name, currentState };
  }, [selectedCell, selectedController, tracks, trackMetaMap]);

  // Track type add dropdown state
  const [showTrackMenu, setShowTrackMenu] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-deep)]">
      <TimelineToolbar
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        currentTime={currentTime}
        totalDuration={cycleDuration}
        onTogglePlay={togglePlay}
        onSetSpeed={setPlaybackSpeed as (speed: PlaybackSpeed) => void}
        onReset={reset}
        onClose={handleClose}
      >
        {selectedController && (
          <span className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-[160px]">
            {selectedController.name}
          </span>
        )}
      </TimelineToolbar>

      {/* Matrix viewport */}
      <div className="flex-1 overflow-auto">
        {selectedController ? (
          <div className="relative min-w-0 flex">
            {/* Main content (header + tracks) */}
            <div className="flex-1 min-w-0">
              {/* Phase header row */}
              <div className="flex items-stretch min-h-[28px] border-b border-[var(--color-glass-edge)] sticky top-0 z-10 bg-[var(--color-bg-deep)]">
                {/* Track add button */}
                <div className="w-[140px] shrink-0 px-2 flex items-center border-r border-[var(--color-glass-edge)] relative">
                  <button
                    type="button"
                    onClick={() => setShowTrackMenu(!showTrackMenu)}
                    className="flex items-center gap-0.5 text-[9px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <Plus className="size-2.5" /> Track
                  </button>
                  {/* Track type dropdown */}
                  {showTrackMenu && (
                    <div className="absolute top-full left-0 z-20 w-48 bg-[var(--color-bg-deep)] border border-[var(--color-glass-edge)] shadow-lg">
                      {SIGNAL_TYPE_PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
                          onClick={() => {
                            handleAddTrack(preset);
                            setShowTrackMenu(false);
                          }}
                        >
                          <SignalIcon2DInline descriptor={preset.descriptor} />
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phase columns */}
                <div className="flex-1 flex items-stretch relative">
                  {selectedController.phases.map((phase, pi) => {
                    const widthPercent =
                      cycleDuration > 0 ? (phase.duration / cycleDuration) * 100 : 0;
                    return (
                      <PhaseHeader
                        key={pi}
                        name={phase.name}
                        duration={phase.duration}
                        widthPercent={widthPercent}
                        onNameChange={(name) => handlePhaseNameChange(pi, name)}
                        onDurationChange={(dur) => handlePhaseDurationChange(pi, dur)}
                        onDelete={() => handleDeletePhase(pi)}
                      />
                    );
                  })}
                  <TimelinePlayhead
                    currentTime={currentTime}
                    totalDuration={cycleDuration}
                    onSeek={setCurrentTime}
                  />
                </div>
              </div>

              {/* Signal tracks */}
              {tracks.map((track) => (
                <SignalTrack
                  key={track.trackKey}
                  track={track}
                  phases={selectedController.phases}
                  totalDuration={cycleDuration}
                  activePhaseIndex={activePhaseIndex}
                  selectedCell={selectedCell}
                  isSelected={selectedTrackKey === track.trackKey}
                  onCellClick={handleCellClick}
                  onTrackSelect={handleTrackSelect}
                  onTrackLabelChange={handleTrackLabelChange}
                  onAddSignalId={handleAddSignalId}
                  onRemoveSignalId={handleRemoveSignalId}
                  onDeleteTrack={handleDeleteTrack}
                  isPickModeTarget={signalPickMode?.trackKey === track.trackKey}
                  isPickModeActive={signalPickMode != null}
                  onEnterPickMode={handleEnterPickMode}
                  onExitPickMode={handleExitPickMode}
                />
              ))}

              {tracks.length === 0 && selectedController.phases.length > 0 && (
                <div className="flex items-center justify-center h-16 text-xs text-[var(--color-text-secondary)]">
                  Click "+ Track" to add a signal type
                </div>
              )}
              {selectedController.phases.length === 0 && (
                <div className="flex items-center justify-center h-16 text-xs text-[var(--color-text-secondary)]">
                  Click + to add a phase
                </div>
              )}
            </div>

            {/* Add Phase column — spans full height, vertically centered */}
            <div className="w-10 shrink-0 border-l border-[var(--color-glass-edge)] flex items-center justify-center">
              <button
                type="button"
                onClick={handleAddPhase}
                className="flex items-center justify-center size-7 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
                title="Add Phase"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Add a controller from the Properties panel
            </p>
          </div>
        )}
      </div>

      {/* Cell editor */}
      {cellEditorInfo && (
        <CellEditor
          track={cellEditorInfo.track}
          phaseName={cellEditorInfo.phaseName}
          currentState={cellEditorInfo.currentState}
          onChangeState={handleCellStateChange}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase header with inline editing
// ---------------------------------------------------------------------------

import { SignalIcon2D } from './SignalIcon2D';

function PhaseHeader({
  name,
  duration,
  widthPercent,
  onNameChange,
  onDurationChange,
  onDelete,
}: {
  name: string;
  duration: number;
  widthPercent: number;
  onNameChange: (name: string) => void;
  onDurationChange: (duration: number) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center border-r border-[var(--color-glass-edge)] overflow-hidden group relative py-0.5 px-0.5 gap-0.5"
      style={{ width: `${widthPercent}%`, minWidth: 40 }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-4 w-full px-0.5 text-[8px] text-center bg-transparent border border-transparent hover:border-[var(--color-glass-edge)] focus:border-[var(--color-accent)] focus:bg-[var(--color-glass-2)] rounded-none text-[var(--color-text-secondary)] outline-none transition-colors"
      />
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0)}
          className="h-4 w-10 px-0.5 text-[8px] text-center bg-transparent border border-transparent hover:border-[var(--color-glass-edge)] focus:border-[var(--color-accent)] focus:bg-[var(--color-glass-2)] rounded-none text-[var(--color-text-secondary)] outline-none transition-colors"
          step="any"
          min={0}
        />
        <span className="text-[8px] text-[var(--color-text-secondary)] opacity-60">s</span>
      </div>
      {/* Delete button (hover) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-[var(--color-status-error)] transition-opacity"
        title="Delete phase"
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}

// Tiny inline signal icon for the track type menu
function SignalIcon2DInline({ descriptor }: { descriptor: SignalDescriptor }) {
  return <SignalIcon2D descriptor={descriptor} activeState="" width={12} height={28} />;
}

