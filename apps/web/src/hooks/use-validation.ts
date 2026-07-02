import { useCallback } from 'react';
import type { ScenarioDocument, ValidationResult } from '@osce/shared';
import { XoscValidator } from '@osce/openscenario';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';

/**
 * Single shared validator instance. The validator is stateless, so reusing one
 * instance avoids re-allocating rule closures on every keystroke when the
 * debounced auto-validation runs.
 */
const sharedValidator = new XoscValidator();

/**
 * Pure validation entry point shared by the manual run (use-validation), the
 * debounced auto-run (use-validation-autorun) and the save-time gate
 * (use-file-operations). Keeping a single call site guarantees identical
 * results across all three paths.
 */
export function runValidationOnDocument(doc: ScenarioDocument): ValidationResult {
  return sharedValidator.validate(doc);
}

export function useValidation() {
  const storeApi = useScenarioStoreApi();
  const setValidationResult = useEditorStore((s) => s.setValidationResult);

  const runValidation = useCallback(() => {
    const doc = storeApi.getState().document;
    const result = runValidationOnDocument(doc);
    setValidationResult(result);
    return result;
  }, [storeApi, setValidationResult]);

  return { runValidation };
}
