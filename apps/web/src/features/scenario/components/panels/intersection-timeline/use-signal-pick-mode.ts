/**
 * Signal Pick Mode: lets the user assign a 3D-viewer-clicked signal to the
 * currently active track. Handles entering/exiting pick mode, processing a
 * pending pick from the 3D viewer, and the Escape-key shortcut to exit.
 */

import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { TrafficSignalController } from '@osce/shared';
import { SIGNAL_CATALOG } from '@osce/3d-viewer';
import { useEditorStore } from '../../../../../stores/editor-store';
import type { SignalPickMode } from '../../../../../stores/editor-store';
import { defaultOffState, type TrackMeta } from './track-meta';

interface UseSignalPickModeParams {
  selectedController: TrafficSignalController | null;
  trackMetaMap: Record<string, TrackMeta[]>;
  setTrackMetaMap: Dispatch<SetStateAction<Record<string, TrackMeta[]>>>;
  updateControllerPhases: (
    updater: (ctrl: TrafficSignalController) => TrafficSignalController,
  ) => void;
}

export function useSignalPickMode({
  selectedController,
  trackMetaMap,
  setTrackMetaMap,
  updateControllerPhases,
}: UseSignalPickModeParams) {
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
    useEditorStore.getState().enterSignalPickMode(mode);
    // setTrackMetaMap is a useState setter (stable identity); it is listed only
    // because extraction turned it into a parameter the linter cannot verify.
  }, [
    pendingSignalPick,
    signalPickMode,
    selectedController,
    trackMetaMap,
    setTrackMetaMap,
    updateControllerPhases,
  ]);

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

  return { signalPickMode, handleEnterPickMode, handleExitPickMode };
}
