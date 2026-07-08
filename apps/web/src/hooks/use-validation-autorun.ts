import { useEffect } from 'react';
import type { ScenarioDocument } from '@osce/shared';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { DebounceScheduler } from '../lib/autosave';
import { runValidationOnDocument } from './use-validation';

/** Quiet period after the last edit before validation runs. */
const DEBOUNCE_MS = 700;
/** Hard ceiling: validate at least this often during continuous editing. */
const MAX_WAIT_MS = 5_000;

/**
 * Debounced auto-validation. Mount once (in EditorLayout).
 *
 * Subscribes imperatively to the scenario document identity (no React
 * re-renders) and, when the autoValidate preference is on, re-runs validation
 * ~700ms after the last edit, publishing the result to the editor store so the
 * panel and status bar stay current without pressing Validate.
 *
 * Mirrors the {@link useAutosave} debounce model: guard is re-checked at both
 * schedule and flush time, and the scheduler is cancelled on unmount.
 */
export function useValidationAutorun(): void {
  const scenarioStoreApi = useScenarioStoreApi();

  useEffect(() => {
    let latestDoc: ScenarioDocument = scenarioStoreApi.getState().document;

    const flush = (): void => {
      if (!useEditorStore.getState().preferences.autoValidate) return;
      const result = runValidationOnDocument(latestDoc);
      useEditorStore.getState().setValidationResult(result);
    };

    const scheduler = new DebounceScheduler({
      debounceMs: DEBOUNCE_MS,
      maxWaitMs: MAX_WAIT_MS,
      flush,
    });

    const unsub = scenarioStoreApi.subscribe((state) => {
      if (state.document === latestDoc) return;
      latestDoc = state.document;
      if (!useEditorStore.getState().preferences.autoValidate) return;
      scheduler.schedule();
    });

    return () => {
      unsub();
      scheduler.cancel();
    };
  }, [scenarioStoreApi]);
}
