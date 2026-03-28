/**
 * Main container for the Intersection Timeline panel.
 *
 * Track-based matrix UI: one controller at a time.
 * Tracks are defined by signal TYPE (not ID) and can have multiple IDs.
 * Columns = phases (shared across all tracks).
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import type { TrafficSignalController } from '@osce/shared';
import { SIGNAL_CATALOG } from '@osce/3d-viewer';
import type { SignalDescriptor } from '@osce/3d-viewer';
import { useScenarioStore, useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { useEditorStore } from '../../../stores/editor-store';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

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
  { key: '1000001', label: '3-color vertical', descriptor: SIGNAL_CATALOG.get('1000001')!, defaultState: 'off;off;off' },
  { key: 'trafficLight:3-light-horizontal', label: '3-color horizontal', descriptor: SIGNAL_CATALOG.get('trafficLight:3-light-horizontal')!, defaultState: 'off;off;off' },
  { key: '1000002', label: 'Pedestrian 2-light', descriptor: SIGNAL_CATALOG.get('1000002')!, defaultState: 'off;off' },
  { key: 'trafficLight:arrow-left', label: 'Arrow left', descriptor: SIGNAL_CATALOG.get('trafficLight:arrow-left')!, defaultState: 'off' },
  { key: 'trafficLight:arrow-right', label: 'Arrow right', descriptor: SIGNAL_CATALOG.get('trafficLight:arrow-right')!, defaultState: 'off' },
  { key: 'trafficLight:arrow-straight', label: 'Arrow straight', descriptor: SIGNAL_CATALOG.get('trafficLight:arrow-straight')!, defaultState: 'off' },
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

let trackCounter = 0;

export function IntersectionTimelinePanel() {
  const storeApi = useScenarioStoreApi();
  const controllers = useScenarioStore(
    useShallow((s) => (s.document.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[]),
  );

  // Selected controller
  const [selectedControllerId, setSelectedControllerId] = useState<string>('');
  const selectedController = useMemo(
    () => controllers.find((c) => c.id === selectedControllerId) ?? controllers[0] ?? null,
    [controllers, selectedControllerId],
  );

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
  const autoGenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedController) return;
    const cid = selectedController.id;
    // Skip if already generated or if trackMetaMap already has entries
    if (autoGenRef.current.has(cid)) return;
    setTrackMetaMap((prev) => {
      if (prev[cid] && prev[cid].length > 0) return prev;
      const seen = new Map<string, TrackMeta>();
      for (const phase of selectedController.phases) {
        for (const st of phase.trafficSignalStates) {
          if (!seen.has(st.trafficSignalId)) {
            const key = `track_${++trackCounter}`;
            seen.set(st.trafficSignalId, {
              trackKey: key,
              label: `Signal ${st.trafficSignalId}`,
              catalogKey: '1000001',
              signalIds: [st.trafficSignalId],
            });
          }
        }
      }
      const generated = Array.from(seen.values());
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

  // --- Controller CRUD ---

  const handleAddController = useCallback(() => {
    const doc = storeApi.getState().document;
    const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
    const id = crypto.randomUUID();
    const newController: TrafficSignalController = {
      id,
      name: `Controller_${signals.length + 1}`,
      phases: [],
    };
    storeApi.getState().updateRoadNetwork({ trafficSignals: [...signals, newController] });
    setSelectedControllerId(id);
  }, [storeApi]);

  const handleDeleteController = useCallback(() => {
    if (!selectedController) return;
    const doc = storeApi.getState().document;
    const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
    const newSignals = signals.filter((c) => c.id !== selectedController.id);
    storeApi.getState().updateRoadNetwork({ trafficSignals: newSignals });
    setSelectedControllerId('');
    setTrackMetaMap((prev) => {
      const next = { ...prev };
      delete next[selectedController.id];
      return next;
    });
  }, [storeApi, selectedController]);

  const handleUpdateControllerProps = useCallback(
    (updates: Partial<Pick<TrafficSignalController, 'name' | 'delay' | 'reference'>>) => {
      if (!selectedController) return;
      const doc = storeApi.getState().document;
      const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
      const newSignals = signals.map((c) =>
        c.id === selectedController.id ? { ...c, ...updates } : c,
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
      state: 'off;off;off',
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
              { trafficSignalId: signalId, state: pending[pi] ?? 'off;off;off' },
            ],
          };
        }),
      }));
    },
    [selectedController, updateControllerPhases],
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
        <div className="flex items-center gap-1">
          {controllers.length > 0 && (
            <Select
              value={selectedController?.id ?? ''}
              onValueChange={setSelectedControllerId}
            >
              <SelectTrigger className="h-6 w-40 text-[10px] rounded-none">
                <SelectValue placeholder="Select controller" />
              </SelectTrigger>
              <SelectContent>
                {controllers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add controller */}
          <button
            type="button"
            onClick={handleAddController}
            title="Add controller"
            className="flex items-center justify-center size-6 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
          >
            <Plus className="size-3" />
          </button>

          {/* Controller settings */}
          {selectedController && (
            <ControllerSettingsMenu
              controller={selectedController}
              onUpdate={handleUpdateControllerProps}
              onDelete={handleDeleteController}
            />
          )}
        </div>
      </TimelineToolbar>

      {/* Matrix viewport */}
      <div className="flex-1 overflow-auto">
        {selectedController ? (
          <div className="relative min-w-0">
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
              <div className="w-8 shrink-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Add Phase"
                >
                  <Plus className="size-3" />
                </button>
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
                onCellClick={handleCellClick}
                onTrackLabelChange={handleTrackLabelChange}
                onAddSignalId={handleAddSignalId}
                onRemoveSignalId={handleRemoveSignalId}
                onDeleteTrack={handleDeleteTrack}
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-xs text-[var(--color-text-secondary)]">
              No traffic signal controllers
            </p>
            <button
              type="button"
              onClick={handleAddController}
              className="flex items-center gap-1.5 h-7 px-3 text-xs text-[var(--color-text-primary)] border border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)] rounded-none transition-colors"
            >
              <Plus className="size-3" />
              Create Controller
            </button>
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
          step={1}
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

// ---------------------------------------------------------------------------
// Controller settings dropdown (name, delay, reference, delete)
// ---------------------------------------------------------------------------

function ControllerSettingsMenu({
  controller,
  onUpdate,
  onDelete,
}: {
  controller: TrafficSignalController;
  onUpdate: (updates: Partial<Pick<TrafficSignalController, 'name' | 'delay' | 'reference'>>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Controller settings"
        className="flex items-center justify-center size-6 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)] transition-colors"
      >
        <Settings2 className="size-3" />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 w-56 bg-[var(--color-bg-deep)] border border-[var(--color-glass-edge)] shadow-lg p-2.5 space-y-2">
          {/* Name */}
          <div className="space-y-0.5">
            <label className="text-[9px] text-[var(--color-text-secondary)]">Name</label>
            <input
              type="text"
              value={controller.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-6 w-full px-1.5 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Delay + Reference */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] text-[var(--color-text-secondary)]">Delay (s)</label>
              <input
                type="number"
                value={controller.delay ?? ''}
                placeholder="--"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onUpdate({ delay: isNaN(v) ? undefined : v });
                }}
                className="h-6 w-full px-1.5 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                step={1}
                min={0}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] text-[var(--color-text-secondary)]">Reference</label>
              <input
                type="text"
                value={controller.reference ?? ''}
                placeholder="--"
                onChange={(e) => onUpdate({ reference: e.target.value || undefined })}
                className="h-6 w-full px-1.5 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Delete */}
          <div className="pt-1 border-t border-[var(--color-glass-edge)]">
            <button
              type="button"
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-1 text-[10px] text-[var(--color-status-error)] hover:text-[var(--color-status-error)]/80 transition-colors"
            >
              <Trash2 className="size-3" />
              Delete controller
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
