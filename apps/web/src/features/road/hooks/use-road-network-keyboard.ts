/**
 * Consolidated window keyboard handling for the road-network editor.
 *
 * Merges the three previously-separate keydown effects:
 * - Delete / Backspace → delete the selected plan-view geometry segments
 * - Escape → step-by-step de-escalation of the active tool (cancel creation,
 *   drop a submode, or fall back to the select tool)
 * - Enter → confirm manual junction creation (when >= 2 endpoints are picked)
 *
 * All handlers ignore events originating from <input> elements, matching the
 * original behavior. Escape reads the tool state fresh from the store, so it
 * needs no dependencies; Delete and Enter close over the passed callbacks.
 */

import { useEffect } from 'react';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';

interface UseRoadNetworkKeyboardParams {
  /** Delete the currently selected plan-view geometry segments. */
  onDeleteSelectedGeometry: () => void;
  /** Confirm manual junction creation. */
  onJunctionConfirm: () => void;
}

export function useRoadNetworkKeyboard({
  onDeleteSelectedGeometry,
  onJunctionConfirm,
}: UseRoadNetworkKeyboardParams): void {
  // Delete/Backspace to remove selected geometry segments
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        onDeleteSelectedGeometry();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDeleteSelectedGeometry]);

  // Escape key: cancel creation or switch back to select tool
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const store = useOdrSidebarStore.getState();
      if (store.activeTool === 'road-create') {
        if (store.roadCreation.phase === 'startPlaced') {
          // Cancel current creation (back to idle)
          store.resetRoadCreation();
        } else {
          // Switch back to select tool
          store.setActiveTool('select');
        }
        e.preventDefault();
      } else if (store.activeTool === 'lane-edit') {
        // Step-by-step de-escalation:
        // 1. Taper start picked → cancel pick (back to taper standby)
        // 2. Split or Taper mode → back to Add/Remove
        // 3. Add/Remove mode → back to Select tool
        const { laneEdit } = store;
        if (laneEdit.taperCreation.phase !== 'idle') {
          store.resetTaperCreation();
        } else if (laneEdit.subMode !== 'select') {
          store.setLaneEditSubMode('select');
        } else {
          store.setActiveTool('select');
        }
        e.preventDefault();
      } else if (store.activeTool === 'junction-create') {
        if (store.junctionCreate.selectedEndpoints.length > 0) {
          store.resetJunctionCreate();
        } else {
          store.setActiveTool('select');
        }
        e.preventDefault();
      } else if (store.activeTool === 'signal-place') {
        store.setActiveTool('select');
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Enter key: confirm junction creation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const store = useOdrSidebarStore.getState();
      if (
        store.activeTool === 'junction-create' &&
        store.junctionCreate.selectedEndpoints.length >= 2
      ) {
        onJunctionConfirm();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onJunctionConfirm]);
}
